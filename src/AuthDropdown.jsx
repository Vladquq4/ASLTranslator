import React, { useState } from "react";
import axios from "axios";
import "./styles/AuthDropdown.css";

const AuthDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleAuth = async () => {
        try {
            const response = await axios.post("http://localhost:5000/auth", {
                email,
                password,
            });

            const { message, user } = response.data;
            setMessage(message);
            console.log("Logged in as:", user);
        } catch (error) {
            setMessage(error.response?.data?.error || "Something went wrong");
        }
    };

    return (
        <div className="auth-container">
            <button className="auth-toggle" onClick={() => setIsOpen(!isOpen)}>
                🔐 Login / Register
            </button>

            {isOpen && (
                <div className="auth-dropdown">
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
            )}
        </div>
    );
};

export default AuthDropdown;
