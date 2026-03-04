# Cat & Dog Image Classifier

This project is an AI-powered web application that classifies images into either cats or dogs. It features a modern, responsive frontend built with React (Vite) and Tailwind CSS, and a fast backend powered by FastAPI and TensorFlow/Keras. It also includes visual heatmaps (Grad-CAM) to show *why* the AI made its decision!

## Tech Stack
* **Frontend:** React, Vite, Tailwind CSS, Framer Motion
* **Backend:** Python, FastAPI, TensorFlow/Keras, OpenCV

---

## 🚀 How to Run Locally

If you want to run this project on your own computer, follow these two steps. You need [Node.js](https://nodejs.org/) and [Python 3.8+](https://www.python.org/downloads/) installed.

### 1. Start the Backend (FastAPI + AI Model)
1. Open a terminal and navigate to the root directory `Mini Project`.
2. (Optional but recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   *The backend is now running at `http://127.0.0.1:8000`*

### 2. Start the Frontend (React Application)
1. Open a *new* terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend is now running at `http://localhost:5173`. Open this URL in your browser to use the app!*

---

## ☁️ How to Upload to GitHub

To store your code safely and share it with others, you should push it to GitHub. 

1. Create a free account on [GitHub](https://github.com/).
2. Create a **New Repository**. Give it a name (e.g., `cat-dog-classifier`) and leave the initialization options empty.
3. Open your terminal in the root `Mini Project` directory.
4. Run these commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Added frontend, backend, and AI model"
   git branch -M main
   git remote add origin https://github.com/Mohankanakam06/cat-dog-classifier.git
   git push -u origin main
   ```

> **Important Note on Large Files:** If your model file (`new_model.keras`) is larger than 100MB, GitHub will block the upload. You will need to use [Git LFS (Large File Storage)](https://git-lfs.github.com/) for that specific file. Your model is currently ~80MB, so it should upload normally.

---

## 🌍 How to Deploy to the Web (Production)

If you want to host this online so anyone can use it without running it on their computer:

### 1. Backend (Render / Railway)
* Sign up for Render or Railway and link your GitHub repository.
* Tell the host to use Python.
* **Build Command:** `pip install -r requirements.txt`
* **Run Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
* *Note: The AI model requires around 512MB-1GB of RAM to run, so the free tiers on some hosts might struggle or take a few seconds to boot up.*

### 2. Frontend (Vercel / Netlify)
* Sign up for Vercel or Netlify and link your GitHub repository.
* Tell the host that the "Root Directory" is `frontend`.
* Add an **Environment Variable**: `VITE_API_URL` and set its value to your live Backend URL (e.g., `https://my-backend.onrender.com`).
* **Build Command:** `npm run build`
* Click Deploy!
