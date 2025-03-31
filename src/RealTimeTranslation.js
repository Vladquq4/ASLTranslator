import React, { useState, useRef, useEffect } from "react";
import BackButton from "./components/BackButton";
import "./styles/RealTimeTranslation.css";

const RealTimeTranslation = () => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationText, setTranslationText] = useState("");
    const videoRef = useRef(null);

    useEffect(() => {
        // Access webcam
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error("Error accessing webcam:", error);
            }
        };

        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleStartTranslation = () => {
        setIsTranslating(true);
        setTranslationText("Translating...");
        setTimeout(() => {
            setTranslationText("Your ASL translation will appear here.");
        }, 2000);
    };

    return (
        <div className="realtime-container">
            <BackButton className="back-button"/>
            <h1 className="realtime-title">Real-Time ASL Translation</h1>

            {/* Webcam Feed */}
            <video ref={videoRef} autoPlay playsInline className="realtime-video"></video>

            {/* Translation Text Box (Appears only when translating) */}
            {isTranslating && <div className="realtime-text-box">{translationText}</div>}

            {/* Start Translation Button */}
            <button onClick={handleStartTranslation} className="realtime-button">
                {isTranslating ? "Translating..." : "Start Translation"}
            </button>
        </div>
    );
};

export default RealTimeTranslation;