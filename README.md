# AI ChatBot

A modern, full-stack AI conversational assistant built with the MERN stack (MongoDB, Express, React, Node.js). Features real-time messaging, secure authentication, and integration with advanced AI models (Google Gemini / HuggingFace).

## Features

-   **Real-time Chat**: Seamless messaging experience using Socket.io.
-   **AI Integration**: Intelligent responses powered by Google Gemini and HuggingFace.
-   **Authentication**: Secure user registration and login with JWT and BCrypt.
-   **Chat History**: Persistent conversation storage in MongoDB.
-   **Modern UI**: Responsive, messenger-style interface built with React and Tailwind CSS.

## Tech Stack

-   **Frontend**: React (Vite), Tailwind CSS, Lucide React
-   **Backend**: Node.js, Express.js, Socket.io
-   **Database**: MongoDB
-   **AI Services**: Google Generative AI (Gemini), HuggingFace Inference
-   **Tools**: Nodemon, Dotenv, CORS, Helmet

## Prerequisites

Ensure you have the following installed:
-   [Node.js](https://nodejs.org/) (v16+)
-   [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ChatBot
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_gemini_api_key
HF_ACCESS_TOKEN=your_huggingface_token
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

## Running the Application

### Start the Backend Server
From the `backend/` directory:

```bash
npm run dev
```
*Server runs on [http://localhost:5001](http://localhost:5001)*

### Start the Frontend Server
From the `frontend/` directory:

```bash
npm run dev
```
*Application runs on [http://localhost:5173](http://localhost:5173)*

## API Endpoints

-   `POST /api/auth/register` - Create new account
-   `POST /api/auth/login` - User login
-   `GET /api/ai/chats` - Get user chat history
-   `POST /api/ai/chat` - Send message to AI
