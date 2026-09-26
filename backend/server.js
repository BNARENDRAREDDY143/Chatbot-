import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env or root .env
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  'https://chatbot-57jp.vercel.app',
  'https://chatbot-1-gfpp.onrender.com',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isVercel = /^https:\/\/.*\.vercel\.app$/.test(origin);
    const isRender = /^https:\/\/.*\.onrender\.com$/.test(origin);
    if (allowedOrigins.includes(origin) || isVercel || isRender) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/enquiry', enquiryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Lara College Chatbot API',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'unavailable'
  });
});

import fs from 'fs';

const distPath = join(__dirname, '../dist');
const hasDist = fs.existsSync(distPath) && fs.existsSync(join(distPath, 'index.html'));

if (hasDist) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // Root route for API only mode
  app.get('/', (req, res) => {
    res.json({
      message: "Welcome to Vignan's Lara Institute of Technology & Science Chatbot API",
      endpoints: {
        health: '/api/health',
        auth: '/api/auth (register, login, me, profile)',
        chat: '/api/chat (POST message, GET history, DELETE history)',
        faq: '/api/faq (GET FAQs, POST FAQ)',
        enquiry: '/api/enquiry (POST submit enquiry)'
      }
    });
  });
}

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Lara College Chatbot Backend Server running on http://localhost:${PORT}`);
});
