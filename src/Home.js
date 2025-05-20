import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/home.css";

const Home = () => {
    const navigate = useNavigate();
    const [droppedLetters, setDroppedLetters] = useState([]);
    const [gameCompleted, setGameCompleted] = useState(false);

    // Combined word list
    const words = [
        "boat", "apple", "cat", "dog", "fish", "house", "idea", "jump", "kite", "lion",
        "tree", "love", "code", "fire", "wind", "moon", "sun", "star", "cloud", "rain",
        "snow", "rock", "river", "ocean", "book", "pen", "car", "train", "plane", "bike",
        "hat", "shoe", "shirt", "pants", "chair", "table", "phone", "clock", "door", "window",
        "key", "map", "road", "bridge", "wall", "grass", "flower", "leaf", "seed", "root",
        "mountain", "valley", "forest", "desert", "beach", "island", "lake", "pond", "hill", "cave",
        "bear", "wolf", "fox", "deer", "owl", "eagle", "hawk", "duck", "swan", "horse",
        "sheep", "goat", "cow", "pig", "chicken", "rooster", "frog", "snake", "whale", "shark",
        "dolphin", "crab", "ant", "bee", "spider", "butterfly", "worm", "dragonfly", "mouse", "rat",
        "monkey", "gorilla", "tiger", "zebra", "camel", "rhino", "hippo", "giraffe", "panda", "koala",
        "peach", "berry", "plum", "melon", "grape", "lemon", "lime", "orange", "banana", "mango",
        "corn", "rice", "wheat", "bread", "milk", "cheese", "butter", "egg", "salt", "sugar",
        "coffee", "tea", "juice", "soup", "cake", "pie", "cookie", "candy", "jam", "honey",
        "sauce", "meat", "bacon", "steak", "pizza", "burger", "salad", "pasta", "noodle", "sushi",
        "hammer", "nail", "screw", "saw", "drill", "brush", "paint", "rope", "chain", "knife",
        "spoon", "fork", "plate", "bowl", "cup", "mug", "bottle", "glass", "jar", "bag",
        "box", "basket", "bucket", "barrel", "net", "tent", "blanket", "pillow", "candle", "lamp",
        "torch", "ring", "necklace", "bracelet", "watch", "belt", "purse", "wallet", "coin", "money",
        "bank", "store", "shop", "market", "school", "class", "teacher", "student", "bookcase", "desk",
        "paper", "pencil", "eraser", "board", "chalk", "music", "song", "dance", "drum", "guitar",
        "piano", "violin", "flute", "trumpet", "harp", "movie", "film", "actor", "actress", "stage",
        "camera", "photo", "picture", "art", "paint", "drawing", "comic", "novel", "poem", "story",
        "letter", "email", "text", "call", "voice", "sound", "noise", "whistle", "horn", "bell",
        "alarm", "sign", "flag", "banner", "poster", "ad", "ticket", "pass", "badge", "medal",
        "trophy", "prize", "gift", "box", "wrap", "ribbon", "balloon", "party", "game", "toy",
        "puzzle", "block", "cube", "sphere", "circle", "square", "triangle", "line", "dot", "point",
        "path", "track", "field", "court", "ring", "arena", "stadium", "race", "goal", "win",
        "loss", "draw", "team", "player", "coach", "referee", "judge", "rule", "score", "match",
        "fight", "battle", "war", "peace", "love", "friend", "enemy", "hero", "villain", "king",
        "queen", "prince", "princess", "knight", "wizard", "witch", "magic", "spell", "potion", "sword",
        "shield", "helmet", "armor", "horse", "dragon", "ghost", "spirit", "monster", "zombie", "vampire",
        "robot", "alien", "ship", "spaceship", "planet", "galaxy", "star", "blackhole", "space", "rocket",
        "earth", "mars", "moon", "sun", "mercury", "venus", "jupiter", "saturn", "uranus", "neptune",
        "pluto", "asteroid", "comet", "meteor", "orbit", "satellite", "explorer", "mission", "future", "past",
        "history", "time", "clock", "watch", "calendar", "year", "month", "week", "day", "hour",
        "minute", "second", "moment", "begin", "end", "start", "finish", "open", "close", "enter",
        "exit", "rise", "fall", "grow", "shrink", "build", "break", "create", "destroy", "learn",
        "teach", "read", "write", "speak", "listen", "hear", "see", "look", "find", "lose",
        "run", "walk", "jump", "fly", "swim", "climb", "crawl", "sit", "stand", "sleep",
        "dream", "think", "believe", "know", "understand", "feel", "touch", "smell", "taste", "laugh",
        "cry", "smile", "hug", "kiss", "help", "save", "give", "take", "share", "keep",
        "push", "pull", "throw", "catch", "hit", "kick", "lift", "drop", "hold", "carry",
        "drive", "ride", "sail", "flow", "burn", "freeze", "melt", "grow", "bloom", "fade",
        "shine", "glow", "spark", "flash", "crash", "boom", "bang", "pop", "whisper", "shout"
    ];

    // Get day of year function
    function getDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    const dayOfYear = getDayOfYear();
    const wordOfTheDay = words[dayOfYear % words.length].toUpperCase();  // use modulo in case more than 365
    const letters = wordOfTheDay.split('');

    // Initialize droppedLetters array when component mounts
    useEffect(() => {
        setDroppedLetters(Array(letters.length).fill(null));
    }, []);

    useEffect(() => {
        if (gameCompleted && droppedLetters.join("") === letters.join("")) {
            updateDailyStreak();
        }
    }, [gameCompleted]);

    // Drag and drop handlers
    const handleDragStart = (e, letter) => {
        e.dataTransfer.setData("text/plain", letter);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        const letter = e.dataTransfer.getData("text/plain");
        const newDroppedLetters = [...droppedLetters];
        newDroppedLetters[index] = letter;
        setDroppedLetters(newDroppedLetters);

        // Check if all letters are placed
        if (newDroppedLetters.every(l => l !== null)) {
            setGameCompleted(true);
        }
    };
    const updateDailyStreak = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user) {
                console.error("No user logged in");
                return;
            }

            await axios.post("http://localhost:5000/update_streak", {
                user_id: user.user_id,
            });

            console.log("Streak updated successfully");
        } catch (error) {
            console.error("Error updating streak:", error);
        }
    };

    return (
        <div className="home-container">
            {/* Title */}
            <h1 className="home-title">Welcome to ASL Translator</h1>

            {/* Flavour Text */}
            <p className="home-description">
                American Sign Language (ASL) is a vibrant visual language used by the Deaf and hard-of-hearing communities.
                It's not just signs for English words — it's a full language with its own grammar and culture!
            </p>

            {/* ASL Alphabet Image */}
            <div className="asl-image-container">
                <img
                    src="/asl-alphabet.png"
                    alt="ASL Alphabet"
                    className="asl-alphabet-image"
                />
            </div>

            {/* Word of the Day Section */}
            <div className="word-of-the-day-container">
                <h2>Word of the Day</h2>
                <div className="word-letters">
                    {letters.map((letter, index) => (
                        <div key={index} className="letter-box">
                            {letter}
                        </div>
                    ))}
                </div>

                <div className="drop-boxes">
                    {droppedLetters.map((droppedLetter, index) => (
                        <div
                            key={index}
                            className="drop-box"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            {droppedLetter ? (
                                <img
                                    src={`/letters/${droppedLetter}.jpg`}
                                    alt={droppedLetter}
                                    className="letter-image-small"
                                />
                            ) : null}
                        </div>
                    ))}
                </div>

                {/* Game completion feedback */}
                {gameCompleted && (
                    <div className="word-check">
                        {droppedLetters.join("") === letters.join("") ? (
                            <h3>✅ Correct!</h3>
                        ) : (
                            <h3>❌ Try Again!</h3>
                        )}
                    </div>
                )}

                {/* Draggable letter images */}
                <div className="letter-images">
                    {letters.map((letter, index) => (
                        <img
                            key={index}
                            src={`/letters/${letter}.jpg`}
                            alt={letter}
                            draggable
                            onDragStart={(e) => handleDragStart(e, letter)}
                            className="letter-image"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;