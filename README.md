# Lara College Enquiry Chatbot 🎓

An intelligent AI-powered college enquiry chatbot application for **Vignan's Lara Institute of Technology & Science (VLITS)**, Vadlamudi, Guntur.

## Features

- 🤖 **Interactive AI Assistant**: Provides instantaneous responses regarding courses, admissions, cutoffs, fee structures, hostel accommodations, bus transport routes, and placements.
- 🔐 **Authentication & User Profile**: Student registration, login, JWT-based secure sessions, and profile editing.
- 💬 **Persistent Chat History**: Stores and manages chat sessions with MongoDB.
- ⚡ **Modern UI/UX**: Built with React, Vite, Tailwind CSS, Framer Motion, and shadcn/ui components.
- 🛡️ **Robust Backend**: Node.js & Express REST API with MongoDB/Mongoose database models and full text search knowledge base.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Radix UI / shadcn/ui, Lucide Icons
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, JWT, bcryptjs, Morgan, CORS
- **Testing**: Vitest, React Testing Library, JSDOM

---

## Getting Started

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

Frontend `.env`:
```env
VITE_BACKEND_URL=http://localhost:5001/api
```

Backend `backend/.env`:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/lara_college_chatbot
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

### 3. Seed Knowledge Base (Optional)

```bash
npm run seed
```

### 4. Run Development Servers

Run backend and frontend:
```bash
# Start backend server
npm run server

# In another terminal, start frontend dev server
npm run dev
```

### 5. Running Tests & Build

```bash
# Run unit tests
npm test

# Build for production
npm run build
```

---

## License

MIT
