import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { collegeData } from '../data/collegeData.js';

// @desc    Get all FAQs / Knowledge Base items
// @route   GET /api/faq
// @access  Public
export const getFAQs = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } }
      ];
    }

    let faqs = [];
    try {
      faqs = await KnowledgeBase.find(filter).sort({ priority: -1, createdAt: -1 });
    } catch (dbError) {
      console.warn('FAQ database unavailable; serving bundled knowledge base:', dbError.message);
    }

    if (faqs.length === 0) {
      const normalizedSearch = String(search || '').toLowerCase();
      faqs = collegeData.filter((item) => {
        const categoryMatches = !category || category === 'all' || item.category === category;
        const searchable = [item.question, item.answer, ...(item.keywords || [])].join(' ').toLowerCase();
        return categoryMatches && (!normalizedSearch || searchable.includes(normalizedSearch));
      });
    }

    res.json({
      success: true,
      count: faqs.length,
      data: faqs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving FAQs', error: error.message });
  }
};

// @desc    Add a new FAQ
// @route   POST /api/faq
// @access  Private/Admin
export const createFAQ = async (req, res) => {
  try {
    const { category, question, answer, keywords, priority } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({ message: 'Category, question, and answer are required' });
    }

    const newFAQ = await KnowledgeBase.create({
      category,
      question,
      answer,
      keywords: Array.isArray(keywords) ? keywords : keywords ? keywords.split(',').map(k => k.trim()) : [],
      priority: priority || 1
    });

    res.status(201).json({
      success: true,
      data: newFAQ
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating FAQ', error: error.message });
  }
};
