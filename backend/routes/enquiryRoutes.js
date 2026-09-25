import express from 'express';
import { submitEnquiry, getEnquiries } from '../controllers/enquiryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', submitEnquiry);
router.get('/', protect, authorize('admin'), getEnquiries);

export default router;
