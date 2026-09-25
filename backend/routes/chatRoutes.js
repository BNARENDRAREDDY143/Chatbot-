import express from 'express';
import { handleChatMessage, getChatHistory, clearChatHistory } from '../controllers/chatController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, handleChatMessage);
router.get('/history', optionalAuth, getChatHistory);
router.delete('/history', protect, clearChatHistory);

export default router;
