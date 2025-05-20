import React, { useState, useRef, useEffect } from "react";
import BackButton from "./components/BackButton";
import "./styles/RealTimeTranslation.css";

const RealTimeTranslation = () => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationText, setTranslationText] = useState("");
    const [letterHistory, setLetterHistory] = useState([]);
    const [error, setError] = useState("");
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 640,
                        height: 480,
                        facingMode: "user"
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setError("");
            } catch (error) {
                console.error("Error accessing webcam:", error);
                setError("Cannot access camera. Please check permissions.");
            }
        };

        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const captureFrame = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas) {
            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = 128;
            canvas.height = 128;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            return new Promise((resolve) => {
                canvas.toBlob(async (blob) => {
                    resolve(blob);
                }, 'image/png', 0.9);
            });
        }
        return null;
    };

    const processFrame = async () => {
        const frameBlob = await captureFrame();
        if (frameBlob) {
            try {
                const formData = new FormData();
                formData.append("image", frameBlob, "frame.png");

                const user = JSON.parse(localStorage.getItem("user"));
                const userId = user?.user_id;
                if (userId) {
                    formData.append("user_id", userId);
                } else {
                    console.warn("No user_id found in localStorage");
                }
                formData.append("source_type", "camera");

                const response = await fetch("http://127.0.0.1:5000/predict", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();

                if (data.error) {
                    console.error("Backend error:", data.error);
                    setError(`Error: ${data.error}`);
                    return null;
                }
                setError("");
                return data.prediction;

            } catch (error) {
                console.error("Error processing frame:", error);
                setError("Connection error. Check if backend server is running.");
                return null;
            }
        }
        return null;
    };

    const handleStartTranslation = () => {
        if (isTranslating) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsTranslating(false);
            // When stopping, send the entire translation to the backend
            sendTranslationToDB(letterHistory.join(" "));
        } else {
            setIsTranslating(true);
            setTranslationText("Waiting for sign...");
            setLetterHistory([]);
            setError("");
            intervalRef.current = setInterval(async () => {
                const prediction = await processFrame();
                if (prediction) {
                    setLetterHistory(prev => {
                        if (prev.length === 0 || prev[prev.length - 1] !== prediction) {
                            const newHistory = [...prev, prediction];
                            setTranslationText(newHistory.join(" "));
                            return newHistory;
                        }
                        return prev;
                    });
                }
            }, 500);
        }
    };

    const sendTranslationToDB = async (finalTranslation) => {
        if (!finalTranslation.trim()) return;

        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.user_id;

        if (!userId) {
            console.warn("User not logged in, cannot save translation.");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/save_translation", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    translated_text: finalTranslation,
                    source_type: "camera",
                }),
            });

            if (response.ok) {
                console.log("Translation saved to DB:", finalTranslation);
                // Optionally, provide user feedback that it's saved
            } else {
                const errorData = await response.json();
                console.error("Failed to save translation:", errorData);
            }
        } catch (error) {
            console.error("Error sending translation to DB:", error);
        }
    };

    const handleClearTranslation = () => {
        setLetterHistory([]);
        setTranslationText("");
    };

    return (
        <div className="realtime-container">
            <h1 className="realtime-title">Real-Time ASL Translation</h1>

            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="realtime-video"
                style={{ border: isTranslating ? '3px solid #4CAF50' : '1px solid #ccc' }}
            ></video>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="realtime-text-box">
                {translationText || "Your ASL translation will appear here."}
            </div>

            <div className="realtime-controls">
                <button
                    onClick={handleStartTranslation}
                    className="realtime-button"
                    disabled={!!error && error.includes("camera")}
                >
                    {isTranslating ? "Stop Translation" : "Start Translation"}
                </button>

                {letterHistory.length > 0 && (
                    <button onClick={handleClearTranslation} className="realtime-button clear-button">
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default RealTimeTranslation;