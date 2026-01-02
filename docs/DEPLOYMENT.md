# Deployment Guide

This guide will help you deploy the ChatBot application to the web for free.

## 1. Backend Deployment (Render)

We need to deploy the Backend **first** so we can get its URL for the Frontend.

### Steps:
1.  Push your latest code to GitHub.
2.  Sign up for [Render](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configure the Service**:
    -   **Root Directory**: `backend`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node src/server.js`
    -   **Environment Variables**:
        -   `NODE_ENV`: `production`
        -   `PORT`: `5001`
        -   `MONGODB_URI`: **Use the connection string provided by MongoDB Atlas**.
            -   *It looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname...`*
        -   `JWT_SECRET`: A long random string.
        -   `GEMINI_API_KEY`: Your Google Gemini API Key.
        -   `HF_ACCESS_TOKEN`: Your Hugging Face Token.
        -   `FRONTEND_URL`: **Put `*` for now** (We will update this in Step 3).

### MongoDB Atlas (Database)
1.  Go to [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Create a free cluster.
3.  Create a database user (username/password).
4.  Get the connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/chatbot?retryWrites=true&w=majority`.

## 2. Frontend Deployment (Vercel)

Now that the Backend is deploying, we can deploy the Frontend.

### Steps:
1.  Sign up for [Vercel](https://vercel.com/signup).
2.  **Add New Project** -> Select your GitHub repository.
3.  **Configure Project**:
    -   **Root Directory**: Click "Edit" and select `frontend`.
    -   **Build Command**: `vite build` (Default is usually correct).
    -   **Output Directory**: `dist` (Default is usually correct).
4.  **Environment Variables**:
    -   `VITE_API_URL`: **The URL of your Backend** from Step 1.
        -   *Example: `https://chatbot-backend.onrender.com/api`*
        -   *IMPORTANT: Make sure to add `/api` at the end!*
5.  Click **Deploy**.

## 3. Final Connection (The "Handshake")

Now that we have the **Frontend URL**, we need to tell the Backend about it (for security/CORS).

1.  Copy your new **Frontend URL** from Vercel (e.g., `https://chatbot-frontend.vercel.app`).
2.  Go back to **Render** (Backend) -> **Environment**.
3.  Edit `FRONTEND_URL` and replace `*` with your actual Frontend URL.
4.  **Save Changes** (Render will automatically redeploy).

🎉 **Done!** Your ChatBot is now live and fully connected.
