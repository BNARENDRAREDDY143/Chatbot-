import { Enquiry } from '../models/Enquiry.js';

// @desc    Submit new college admission/general enquiry
// @route   POST /api/enquiry
// @access  Public
export const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, courseOfInterest, message } = req.body;

    if (![name, email, phone, message].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Please provide name, email, phone, and your query/message.' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      courseOfInterest: courseOfInterest || 'General',
      message
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your enquiry. The Lara Admissions cell will contact you shortly!',
      data: enquiry
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting enquiry', error: error.message });
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiry
// @access  Private/Admin
export const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching enquiries', error: error.message });
  }
};
