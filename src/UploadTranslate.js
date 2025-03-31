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

    const handleTranslate = () => {
        setTranslation("N O K I A");
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: "image/png",
        onDrop,
        multiple: true,
    });

    return (
        <div className="upload-container">
            <BackButton className="back-button"/>
            <h1 className="upload-title">Upload & Translate</h1>

            <div {...getRootProps()} className="upload-box">
                <input {...getInputProps()} />
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
