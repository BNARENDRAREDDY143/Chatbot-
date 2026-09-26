# Vignan's Lara Institute of Technology & Science - College Enquiry Chatbot

An AI-powered College Enquiry Chatbot and Student Portal for **Vignan's Lara Institute of Technology & Science (VLITS)**, built with React, Tailwind CSS, Vite, and an Express / Flask backend with SQLite / MongoDB support.

---

## 🚀 Features

- **Interactive AI Chatbot**: Instant answers to student inquiries regarding admissions, courses (CSE, AI&ML, Data Science, ECE, ME, CE, etc.), fee structures, placement records, hostels, transportation, and campus life.
- **Smart Knowledge Base & Fallback System**: Fast keyword and semantic search over comprehensive college enquiry data, with optional Gemini / OpenAI LLM integration.
- **User Authentication**: Student/Visitor registration and login with JWT token-based authentication and profile management.
- **Enquiry & Support System**: Submit admission and general inquiries directly through the portal.
- **Responsive & Modern UI**: Built with Radix UI, Lucide icons, Framer Motion animations, and Sonner notifications.

---

## 🛠️ Project Structure

```
├── src/                    # Frontend React Application
│   ├── components/         # Reusable UI components & Navbar
│   ├── hooks/              # Custom hooks (useAuth, use-toast, etc.)
│   ├── pages/              # Pages: Chat, Auth, Profile, About, etc.
│   ├── services/           # Frontend API client (services/api.js)
│   └── index.css           # Styling
├── backend/                # Backend Server
│   ├── config/             # Database connection setup
│   ├── controllers/        # Auth, Chat, FAQ, and Enquiry controllers
│   ├── data/               # Knowledge base college data
│   ├── models/             # Mongoose & SQLite models
│   ├── routes/             # REST API routes
│   ├── server.js           # Express.js backend server
│   └── app.py              # Flask / Python alternative backend
├── package.json            # Frontend & project dependencies
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: v18+ installed
- **npm** or **bun** / **yarn**

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will start at `http://localhost:5173`.

### 3. Backend Setup

#### Running the Node.js / Express Backend (Recommended)
```bash
# In the backend directory
cd backend
npm install
npm start
```
Or from root:
```bash
npm run server:node
```
The server will run on `http://localhost:5001`.

#### Running the Python / Flask Backend (Alternative)
```bash
# In the backend directory
cd backend
pip install -r requirements.txt
python app.py
```
Or from root:
```bash
npm run server
```

---

## 🔑 Environment Configuration

### Frontend (`.env` in root)
```env
VITE_BACKEND_URL="http://localhost:5001/api"
```

### Backend (`backend/.env`)
```env
PORT=5001
JWT_SECRET=lara_college_chatbot_secret_jwt_key_2026_xyz123
DATABASE_URL=sqlite:///lara_college.db
# Optional LLM integration
# GEMINI_API_KEY=your_gemini_api_key
# OPENAI_API_KEY=your_openai_api_key
```

---

## 🧪 Testing and Linting

- **Run unit tests**: `npm test`
- **Run linter**: `npm run lint`
- **Build production bundle**: `npm run build`
