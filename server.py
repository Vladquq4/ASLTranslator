from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import os
import cv2
import mediapipe as mp
import bcrypt
from dotenv import load_dotenv
from supabase import create_client
import pickle
from datetime import date, timedelta

# === Load environment variables ===
load_dotenv(dotenv_path="C:/Users/Vlad/PycharmProjects/PythonProject1/db.env")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# === Initialize Supabase ===
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# === Initialize Flask ===
app = Flask(__name__)
CORS(app)

# === Load the ML model (using pickle) ===
with open("model0.p", 'rb') as file:
    model_dict = pickle.load(file)
    model = model_dict['model']

# === Define ASL labels ===
asl_labels = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

# === Verify expected features ===
expected_features = model.n_features_in_
print(f"Model expects {expected_features} input features.")

# === ASL Prediction Logic ===
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=2, min_detection_confidence=0.5)

def extract_keypoints(results):
    lh_coords = []
    rh_coords = []

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            x_coords = [lm.x for lm in hand_landmarks.landmark]
            y_coords = [lm.y for lm in hand_landmarks.landmark]
            min_x = min(x_coords) if x_coords else 0
            min_y = min(y_coords) if y_coords else 0
            hand_features = []
            for i in range(len(hand_landmarks.landmark)):
                hand_features.append(hand_landmarks.landmark[i].x - min_x)
                hand_features.append(hand_landmarks.landmark[i].y - min_y)

            # Determine if it's left or right hand (simplified assumption)
            # This is a simplification and might not be robust
            is_left = hand_landmarks.landmark[mp_hands.HandLandmark.WRIST].x < 0.5 if hand_landmarks.landmark else False

            if is_left and len(lh_coords) == 0:
                lh_coords = hand_features
            elif not is_left and len(rh_coords) == 0:
                rh_coords = hand_features

    lh_padded = lh_coords[:42] + [0] * (42 - len(lh_coords))
    rh_padded = rh_coords[:42] + [0] * (42 - len(rh_coords))

    combined = np.array(lh_padded + rh_padded)[:42] # Take the first 42
    return combined

def predict_single_image(image_file):
    img = Image.open(io.BytesIO(image_file.read())).convert("RGB")
    img_np = np.array(img)
    img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    results = hands.process(img_cv)

    keypoints = extract_keypoints(results)
    if keypoints.shape[0] != expected_features:
        raise ValueError(f"Extracted keypoints have {keypoints.shape[0]} features, expected {expected_features}. Got {keypoints.shape[0]}")

    reshaped_keypoints = keypoints.reshape(1, -1)

    with open("model0.p", 'rb') as file:
        model_dict = pickle.load(file)
        model = model_dict['model']

    try:
        prediction_probabilities = model.predict_proba(reshaped_keypoints)
        predicted_class_index = np.argmax(prediction_probabilities, axis=1)[0]
        predicted_label = asl_labels[predicted_class_index]
        return predicted_label
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise

@app.route("/predict", methods=["POST"])
def predict():
    try:
        file = request.files.get("image")
        if not file:
            return jsonify({"error": "Image file is required"}), 400

        user_id = request.form.get("user_id")
        source_type = request.form.get("source_type", "image")

        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        predicted_label = predict_single_image(file)
        if predicted_label is None:
            return jsonify({"prediction": ""})  # Or handle no hand detection differently

        return jsonify({"prediction": predicted_label})

    except Exception as e:
        print(f"Error in prediction endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/save_translation", methods=["POST"])
def save_translation():
    data = request.get_json()
    user_id = data.get("user_id")
    translated_text = data.get("translated_text")
    source_type = data.get("source_type")

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    if translated_text is None:
        return jsonify({"error": "Translated text is required"}), 400
    if not source_type:
        return jsonify({"error": "Source type is required"}), 400

    try:
        supabase.table("translations").insert({
            "user_id": user_id,
            "translated_text": translated_text,
            "source_type": source_type
        }).execute()
        return jsonify({"message": "Translation saved successfully"}), 200
    except Exception as e:
        print(f"Error saving translation: {e}")
        return jsonify({"error": f"Error saving translation: {str(e)}"}), 500

# === Combined Login/Register Auth Endpoint ===
@app.route("/auth", methods=["POST"])
def auth():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    # Check if user exists
    response = supabase.table("users").select("*").eq("email", email).execute()
    users = response.data

    if users:
        stored_hash = users[0]["password"]
        if bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            return jsonify({
                "message": "Login successful",
                "user": {
                    "user_id": users[0]["user_id"],
                    "email": users[0]["email"]
                }
            }), 200
        else:
            return jsonify({"error": "Incorrect password"}), 401
    else:
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        try:
            insert_response = supabase.table("users").insert({
                "email": email,
                "password": hashed
            }).execute()
            new_user = insert_response.data[0]
            return jsonify({
                "message": "Registration successful",
                "user": {
                    "user_id": new_user["user_id"],
                    "email": new_user["email"]
                }
            }), 201
        except Exception as e:
            return jsonify({"error": f"Registration failed: {str(e)}"}), 500

# === Daily Streak Endpoint ===
@app.route("/daily_streak", methods=["POST"])
def daily_streak():
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    today = date.today()

    response = supabase.table("daily_streaks").select("*").eq("user_id", user_id).execute()
    streaks = response.data

    if streaks:
        streak = streaks[0]
        last_date = date.fromisoformat(streak["last_completed_date"])

        if today == last_date + timedelta(days=1):
            updated_streak = {
                "streak_count": streak["streak_count"] + 1,
                "last_completed_date": today.isoformat()
            }
            supabase.table("daily_streaks").update(updated_streak).eq("id", streak["id"]).execute()
            return jsonify({"message": "Streak continued!", "streak_count": updated_streak["streak_count"]}), 200
        elif today == last_date:
            return jsonify({"message": "Already completed today!", "streak_count": streak["streak_count"]}), 200
        else:
            new_streak = {
                "start_date": today.isoformat(),
                "streak_count": 1,
                "last_completed_date": today.isoformat()
            }
            supabase.table("daily_streaks").update(new_streak).eq("id", streak["id"]).execute()
            return jsonify({"message": "Streak reset!", "streak_count": 1}), 200
    else:
        new_entry = {
            "user_id": user_id,
            "start_date": today.isoformat(),
            "streak_count": 1,
            "last_completed_date": today.isoformat()
        }
        supabase.table("daily_streaks").insert(new_entry).execute()
        return jsonify({"message": "First streak entry created!", "streak_count": 1}), 201

# === Run Server ===
if __name__ == "__main__":
    app.run(debug=True)