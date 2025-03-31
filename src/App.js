import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import RealTimeTranslation from "./RealTimeTranslation";
import PhotoUpload from "./UploadTranslate";

const App = () => {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/real-time" element={<RealTimeTranslation />} />
          <Route path="/upload" element={<PhotoUpload />} />
        </Routes>
      </Router>
  );
};

export default App;
