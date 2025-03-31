import React from "react";
import '../styles/CostumButton.css'

const CustomButton = ({ text, onClick }) => {
    return (
        <button onClick={onClick} className="costum-button"> {text}</button>
    );
};

export default CustomButton;
