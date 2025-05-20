// src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import '../styles/Layout.css'

const Layout = () => {
    const [showAuthModal, setShowAuthModal] = useState(true);
    useEffect(() => {
        console.log("Checking localStorage for user...");
        const user = localStorage.getItem("user");
        console.log("User in localStorage:", user);
        if (user) {
            console.log("User found, hiding auth modal.");
            setShowAuthModal(false);
        } else {
            console.log("No user found, keeping auth modal open.");
            setShowAuthModal(true);
        }
    }, []);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setShowAuthModal(false); // If already logged in before
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.reload();
    };

    const handleAuth = async () => {
        try {
            const response = await axios.post("http://localhost:5000/auth", {
                email,
                password,
            });

            const { message, user } = response.data;
            alert(`${message}\nLogged in as: ${user.email}`);

            localStorage.setItem("user", JSON.stringify(user));
            setShowAuthModal(false); // Close modal after successful login
            setMessage("");
        } catch (error) {
            setMessage(error.response?.data?.error || "Something went wrong");
        }
    };

    return (
        <div className="layout">
            {showAuthModal && (
                <div className="auth-overlay">
                    <div className="auth-modal">
                        <h2>Login / Register</h2>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button onClick={handleAuth}>Submit</button>
                        {message && <p className="auth-message">{message}</p>}
                    </div>
                </div>
            )}

            <nav className="navbar">
                <h2 className="logo">ASL Translator</h2>
                <ul className="nav-buttons">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/real-time">Real-Time</Link></li>
                    <li><Link to="/upload">Upload</Link></li>
                    <li><Link to="/future">Future</Link></li>
                </ul>
                <div className="logout-container">
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </nav>

            <main className={`page-content ${showAuthModal ? "blurred" : ""}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
