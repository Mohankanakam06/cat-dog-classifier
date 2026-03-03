import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ResultDisplay from './components/ResultDisplay';
import HistoryList from './components/HistoryList';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const PREDICT_API = `${API_BASE_URL}/predict`;
function App() {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Load sample image handler
  const handleSample = async (type) => {
    try {
      setIsProcessing(true);
      setError(null);
      // Fetch sample from backend
      const response = await fetch(`${API_BASE_URL}/sample-${type}`); if (!response.ok) throw new Error(`Failed to load ${type} sample`);

      const blob = await response.blob();
      const file = new File([blob], `sample-${type}.jpg`, { type: 'image/jpeg' });
      handleFileUpload(file);
    } catch (err) {
      console.error(err);
      setError("Failed to load sample image. Ensure backend is running.");
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (fileOrType) => {
    if (typeof fileOrType === 'string') {
      handleSample(fileOrType);
      return;
    }

    const file = fileOrType;
    if (!file) return;

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setImage(objectUrl);
    setPrediction(null);
    setError(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(PREDICT_API, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setPrediction(data);

      // Add to history
      const historyItem = {
        id: Date.now(),
        image: objectUrl,
        label: data.label,
        confidence: data.confidence,
        timestamp: new Date().toISOString(),
        heatmap: data.heatmap, // Store heatmap ref or data if needed
        prediction: data
      };

      setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHistorySelect = (item) => {
    setImage(item.image);
    setPrediction(item.prediction);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-main flex flex-col font-sans selection:bg-accent-primary selection:text-white">
      <Header />

      <main className="flex-1 p-4 lg:p-6 h-[calc(100vh-70px)] overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">

          {/* Left Panel: Upload & History */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-3 flex flex-col gap-6 h-full"
          >
            <div className="flex-none h-[320px]">
              <UploadZone onFileSelected={handleFileUpload} isProcessing={isProcessing} />
            </div>
            <div className="flex-1 min-h-[300px]">
              <HistoryList history={history} onSelect={handleHistorySelect} />
            </div>
          </motion.div>

          {/* Center Panel: Main Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="lg:col-span-9 h-full flex flex-col"
          >
            <ResultDisplay
              image={image}
              prediction={prediction}
              heatmap={prediction?.heatmap}
              isProcessing={isProcessing}
              error={error}
            />
          </motion.div>

        </div>
      </main>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

export default App;
