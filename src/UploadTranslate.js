import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BackButton from "./components/BackButton";
import "./styles/UploadTranslate.css";

const SortableItem = ({ image, id }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="uploaded-image">
            <img src={image} alt="Uploaded" />
        </div>
    );
};

const UploadTranslate = () => {
    const [images, setImages] = useState([]);
    const [showTranslate, setShowTranslate] = useState(false);
    const [translation, setTranslation] = useState("");

    const onDrop = (acceptedFiles) => {
        const imageUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
        setImages((prevImages) => [...prevImages, ...imageUrls]);
        setShowTranslate(true);
    };

    const onDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = images.indexOf(active.id);
            const newIndex = images.indexOf(over.id);
            setImages((prev) => arrayMove(prev, oldIndex, newIndex));
        }
    };

    const handleTranslate = async () => {
        if (images.length === 0) return;

        setTranslation("Translating..."); // Show loading state

        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const userId = user?.user_id;

            if (!userId) {
                setTranslation("User not logged in.");
                return;
            }

            const formData = new FormData();
            for (let imageUrl of images) {
                const blob = await fetch(imageUrl).then(res => res.blob());
                formData.append("image", blob, "image.png"); // Append each image
            }
            formData.append("user_id", userId);
            formData.append("source_type", "upload");

            const response = await fetch("http://127.0.0.1:5000/predict", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("Backend Response:", data);

            if (!data.prediction) {
                setTranslation("Translation failed.");
                return;
            }

            setTranslation(data.prediction);

        } catch (error) {
            console.error("Translation failed:", error);
            setTranslation("Error translating. Try again.");
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: "image/png",
        onDrop,
        multiple: true,
    });

    return (
        <div className="upload-container">
            <h1 className="upload-title">Upload & Translate</h1>

            <div {...getRootProps()} className="upload-box">
                <input {...getInputProps()} multiple /> {/* Important: add 'multiple' to the input */}
                <p>Click to upload PNG images</p>
            </div>

            {images.length > 0 && (
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={images} strategy={verticalListSortingStrategy}>
                        <div className="image-container">
                            {images.map((image, index) => (
                                <SortableItem key={image} id={image} image={image} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {showTranslate && (
                <button onClick={handleTranslate} className="translate-button">
                    Translate
                </button>
            )}

            {translation && <div className="translation-box">{translation}</div>}
        </div>
    );
};

export default UploadTranslate;