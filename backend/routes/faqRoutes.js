import express from 'express';
import { getFAQs, createFAQ } from '../controllers/faqController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getFAQs);
router.post('/', protect, authorize('admin'), createFAQ);

export default router;
