# Deployment Guide

This guide will help you deploy the ChatBot application to the web for free.

## 1. Backend Deployment (Render)

We will use [Render](https://render.com/) because it supports Node.js and works well for free.

### Steps:
1.  Push your latest code to GitHub.
2.  Sign up for [Render](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configure the Service**:
    -   **Root Directory**: `backend`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node src/server.js`
    -   **Environment Variables** (Add these in the "Environment" tab):
        -   `NODE_ENV`: `production`
        -   `PORT`: `5001` (or let Render assign one, usually uses `PORT`)
        -   `MONGODB_URI`: Your MongoDB Atlas connection string (see below).
        -   `JWT_SECRET`: A long random string.
        -   `GEMINI_API_KEY`: Your Google Gemini API Key.
        -   `HF_ACCESS_TOKEN`: Your Hugging Face Token.
        -   `FRONTEND_URL`: The URL of your frontend (you'll get this in step 2).

### MongoDB Atlas (Database)
1.  Go to [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Create a free cluster.
3.  Create a database user (username/password).
4.  Get the connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/chatbot?retryWrites=true&w=majority`.

## 2. Frontend Deployment (Vercel)

We will use [Vercel](https://vercel.com/) for the React frontend.

### Steps:
1.  Sign up for [Vercel](https://vercel.com/signup).
2.  **Add New Project** -> Select your GitHub repository.
3.  **Configure Project**:
    -   **Root Directory**: Click "Edit" and select `frontend`.
    -   **Build Command**: `vite build` (Default is usually correct).
    -   **Output Directory**: `dist` (Default is usually correct).
4.  **Environment Variables**:
    -   `VITE_API_URL`: The URL of your **Backend** from Step 1 (e.g., `https://chatbot-backend.onrender.com/api`).
        -   *Note: Make sure to add `/api` at the end.*
5.  Click **Deploy**.

## 3. Final Connection
1.  Once the Frontend is deployed, copy its URL (e.g., `https://chatbot-frontend.vercel.app`).
2.  Go back to **Render** (Backend) -> Environment Variables.
3.  Update (or Add) `FRONTEND_URL` with your Vercel URL.
4.  **Redeploy** the Backend (or it might auto-restart).

🎉 Your ChatBot is now live!
