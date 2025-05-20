import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import RealTimeTranslation from "./RealTimeTranslation";
import PhotoUpload from "./UploadTranslate";
import Layout from "./components/layout";

const App = () => {
  return (
      <Router>
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/real-time" element={<RealTimeTranslation />} />
                <Route path="/upload" element={<PhotoUpload />} />
                <Route path="/future" element={<div>Future Page Coming Soon!</div>} />
            </Route>
        </Routes>
      </Router>
  );
};

export default App;
