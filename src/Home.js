import React from "react";
import { useNavigate } from "react-router-dom";
import CustomButton from "./components/CustomButton";
import "./styles/home.css";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <h1 className="home-title">ASL Translation</h1>
            <div className="home-buttons">
                <CustomButton text="Real-Time Translation" onClick={() => navigate("/real-time")} className="home-button" />
                <CustomButton text="Upload & Translate" onClick={() => navigate("/upload")} className="home-button" />
            </div>
        </div>
    );
};

export default Home;