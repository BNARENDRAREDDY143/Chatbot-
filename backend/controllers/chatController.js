import { ChatMessage } from '../models/ChatMessage.js';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { collegeData } from '../data/collegeData.js';
import mongoose from 'mongoose';

// Fallback search in memory or MongoDB for quick, accurate responses
const findBestCollegeAnswer = async (userQuery) => {
  const queryLower = userQuery.toLowerCase().trim();
  const words = queryLower.split(/\s+/).filter(w => w.length > 2);

  try {
    // 1. First check MongoDB KnowledgeBase if available
    const dbDocs = mongoose.connection.readyState === 1
      ? await KnowledgeBase.find({}).lean()
      : [];
    const sourceData = dbDocs.length > 0 ? dbDocs : collegeData;

    let bestMatch = null;
    let highestScore = 0;

    for (const item of sourceData) {
      let score = 0;

      // Exact keyword matches
      if (item.keywords && Array.isArray(item.keywords)) {
        for (const kw of item.keywords) {
          if (queryLower.includes(kw.toLowerCase())) {
            score += 3;
          }
          for (const word of words) {
            if (kw.toLowerCase().includes(word)) {
              score += 1.5;
            }
          }
        }
      }

      // Question similarity
      if (item.question && item.question.toLowerCase().includes(queryLower)) {
        score += 5;
      }
      for (const word of words) {
        if (item.question && item.question.toLowerCase().includes(word)) {
          score += 1;
        }
      }

      // Add priority weight
      score += (item.priority || 1) * 0.2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && highestScore >= 1.5) {
      return {
        reply: bestMatch.answer,
        category: bestMatch.category || 'general'
      };
    }
  } catch (err) {
    console.error('Error querying knowledge base:', err);
  }

  // Generic intelligent fallback
  return {
    reply: `I can help you with admissions, courses (CSE, AI&ML, Data Science, ECE, ME, etc.), fee structures, placement statistics (85%+ placed, highest ₹24 LPA), hostel accommodations, bus transport routes, and contact details for **Vignan's Lara Institute of Technology & Science**.\n\nCould you please specify your query or contact the admissions desk at **+91-863-2381200** / **admissions@vignanlara.org**?`,
    category: 'general'
  };
};

// Optional LLM API integration (Gemini / OpenAI)
const callExternalLLM = async (userMessage) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `You are the official AI admissions and enquiry assistant for Vignan's Lara Institute of Technology & Science (VLITS), located in Vadlamudi, Guntur, AP.
College Code: LARA.
Courses: B.Tech in CSE, CSE (AI&ML), CSE (Data Science), IT, ECE, EEE, ME, CE, plus M.Tech and MCA.
Placements: 85%+ placements, top packages up to 24 LPA, top companies like TCS, Infosys, Wipro, Amazon, Cognizant.
Facilities: Modern labs, central library, boys & girls hostels, 40+ college buses, sports complex.
Contact: +91-863-2381200, admissions@vignanlara.org.

Answer the user in a warm, polite, formatted markdown structure. Keep answers concise and helpful.`;

  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }]
              }
            ]
          })
        }
      );
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return reply;
    } catch (e) {
      console.warn('Gemini API call failed, falling back to Knowledge Base:', e.message);
    }
  }

  if (openAiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 400
        })
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return reply;
    } catch (e) {
      console.warn('OpenAI API call failed, falling back to Knowledge Base:', e.message);
    }
  }

  return null;
};

// Helper to analyze uploaded documents
const analyzeUploadedDocument = (fileName = '', fileType = '', userMessage = '') => {
  const nameLower = fileName.toLowerCase();
  const msgLower = (userMessage || '').toLowerCase();

  if (nameLower.includes('rank') || nameLower.includes('eamcet') || nameLower.includes('jee') || nameLower.includes('ecet') || nameLower.includes('icet')) {
    return {
      category: 'admissions',
      reply: `📄 **Rank Card / Entrance Exam Document Received: \`${fileName}\`**\n\n` +
        `Here is the admission & counseling guidance for **Vignan's Lara Institute of Technology & Science (College Code: LARA)**:\n\n` +
        `• **Counseling Code:** LARA (AP EAMCET / ECET / ICET / PGECET)\n` +
        `• **Admissions Eligibility:** 50%+ in 10+2 / Intermediate with MPC for B.Tech.\n` +
        `• **Available Branches:** CSE, CSE (AI & ML), CSE (Data Science), Information Technology (IT), ECE, EEE, Mechanical (ME), Civil (CE).\n` +
        `• **Verification Steps:** Please bring 3 sets of attested xerox copies and your original rank card during physical reporting at VLITS Campus, Vadlamudi.\n` +
        `• **Helpline:** Contact admissions office directly at **+91-863-2381200** or **admissions@vignanlara.org** for seat reservation and management quota queries.`
    };
  }

  if (nameLower.includes('mark') || nameLower.includes('10th') || nameLower.includes('12th') || nameLower.includes('inter') || nameLower.includes('diploma') || nameLower.includes('memo') || nameLower.includes('transcript')) {
    return {
      category: 'admissions',
      reply: `📄 **Academic Marks Memo / Transcript Received: \`${fileName}\`**\n\n` +
        `Thank you for providing your academic records. Here are the next steps for verification at **VLITS**:\n\n` +
        `• **Minimum Requirement:** Minimum 45%–50% aggregate in PCM for General category (40% for Reserved categories) as per AICTE/JNTUK norms.\n` +
        `• **Scholarship / Fee Concessions:** Merit scholarships are awarded for students scoring 90%+ in Intermediate / 10+2.\n` +
        `• **Document Checklist for Admission:** Original Marks Memo, Transfer Certificate (TC), Study/Conduct Certificates (6th to Inter), Caste/Income certificates (if applicable), and 4 passport size photos.\n` +
        `• For document pre-evaluation, you can also email **admissions@vignanlara.org** with your contact number.`
    };
  }

  if (nameLower.includes('fee') || nameLower.includes('receipt') || nameLower.includes('challan') || nameLower.includes('payment') || nameLower.includes('transaction')) {
    return {
      category: 'fees',
      reply: `🧾 **Fee Receipt / Payment Proof Received: \`${fileName}\`**\n\n` +
        `• **Accounts Verification:** Fee receipts are verified by the VLITS Accounts Section (Admin Block, Room 104).\n` +
        `• **Processing Time:** Online / NEFT / RTGS payments are reflected in your student ledger within 24–48 working hours.\n` +
        `• **Need Official Receipt?** You can collect the physical stamped receipt from the accounts desk by presenting this transaction receipt.\n` +
        `• For accounts enquiries, contact: **accounts@vignanlara.org** / **+91-863-2381200**.`
    };
  }

  if (nameLower.includes('resume') || nameLower.includes('cv') || nameLower.includes('placement') || nameLower.includes('internship')) {
    return {
      category: 'placements',
      reply: `💼 **Resume / Career Document Received: \`${fileName}\`**\n\n` +
        `• **Training & Placement Cell (T&P):** VLITS has an active placement cell with 85%+ campus placement record and 40+ recruiting partners (TCS, Infosys, Wipro, Amazon, Cognizant, etc.).\n` +
        `• **Placement Training:** Special CRT (Campus Recruitment Training), coding bootcamps in DSA, Full-Stack, and AI/ML are conducted starting from the 3rd year.\n` +
        `• **Highest Package:** ₹24 LPA | **Average Package:** ₹4.5 - ₹6 LPA.\n` +
        `• For placement assistance and drive schedules, contact: **placements@vignanlara.org**.`
    };
  }

  // Generic document response
  return {
    category: 'general',
    reply: `📎 **File Attached:** \`${fileName}\` (${fileType || 'Document'})\n\n` +
      `Your file has been uploaded to the assistant. If this relates to **Admissions, Certificate Verification, Fee Inquiries, or Placements**, our admissions desk at Vignan's Lara Institute of Technology & Science will assist you.\n\n` +
      `How can I assist you with this document? Feel free to ask about courses, cutoff ranks, fee details, or campus facilities.`
  };
};

// @desc    Process a chat message & return response
// @route   POST /api/chat
// @access  Public / Optional Auth
export const handleChatMessage = async (req, res) => {
  try {
    const { message, sessionId, attachment } = req.body;

    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedMessage && !attachment) {
      return res.status(400).json({ message: 'Message text or an attachment is required' });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ message: 'Message must be 2000 characters or fewer' });
    }

    let reply = null;
    let category = 'general';

    // 1. If attachment provided with no/minimal text, use document analyzer
    if (attachment && (!trimmedMessage || trimmedMessage.toLowerCase().includes('uploaded file') || trimmedMessage.length < 5)) {
      const docAnalysis = analyzeUploadedDocument(attachment.fileName, attachment.fileType, trimmedMessage);
      reply = docAnalysis.reply;
      category = docAnalysis.category;
    }

    // 2. Try external LLM if configured and prompt is detailed
    if (!reply && (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)) {
      const enrichedPrompt = attachment
        ? `[User attached file: ${attachment.fileName} (${attachment.fileType})]\n${trimmedMessage}`
        : trimmedMessage;
      reply = await callExternalLLM(enrichedPrompt);
    }

    // 3. Built-in KnowledgeBase search
    if (!reply && trimmedMessage) {
      const kbResult = await findBestCollegeAnswer(trimmedMessage);
      reply = kbResult.reply;
      category = kbResult.category;
    }

    // 4. Fallback if still empty
    if (!reply) {
      if (attachment) {
        const docAnalysis = analyzeUploadedDocument(attachment.fileName, attachment.fileType, trimmedMessage);
        reply = docAnalysis.reply;
        category = docAnalysis.category;
      } else {
        reply = `I can help you with admissions, courses, fee structures, placement statistics, hostels, and bus transport for **Vignan's Lara Institute of Technology & Science**.\n\nPlease feel free to ask your question or contact our admissions desk at **+91-863-2381200**.`;
      }
    }

    // 5. Save chat message to MongoDB
    let savedChat = null;
    try {
      savedChat = await ChatMessage.create({
        userId: req.user ? req.user._id : null,
        sessionId: sessionId || (req.user ? req.user._id.toString() : 'guest-session'),
        message: trimmedMessage || `Attached file: ${attachment?.fileName || 'Document'}`,
        reply,
        category,
        attachment: attachment ? {
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          fileUrl: attachment.fileUrl
        } : undefined
      });
    } catch (saveErr) {
      console.warn('Warning: Could not persist message to MongoDB:', saveErr.message);
    }

    res.json({
      success: true,
      reply,
      category,
      attachment: savedChat?.attachment || attachment,
      chatId: savedChat?._id || Date.now().toString(),
      createdAt: savedChat?.createdAt || new Date()
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({
      reply: 'Sorry, I encountered an error processing your request. Please try asking again or contact the admissions desk at +91-863-2381200.',
      error: error.message
    });
  }
};

// @desc    Get user's chat history
// @route   GET /api/chat/history
// @access  Private / Optional Auth with sessionId
export const getChatHistory = async (req, res) => {
  try {
    const query = {};
    if (req.user) {
      query.userId = req.user._id;
    } else if (req.query.sessionId) {
      query.sessionId = req.query.sessionId;
    } else {
      return res.json({ success: true, history: [] });
    }

    const history = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: history.length,
      history: history.map((item) => ({
        id: item._id,
        message: item.message,
        reply: item.reply,
        category: item.category,
        attachment: item.attachment,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};

// @desc    Clear user's chat history
// @route   DELETE /api/chat/history
// @access  Private
export const clearChatHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required to clear history' });
    }

    await ChatMessage.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing chat history' });
  }
};
