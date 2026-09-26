import { ChatMessage } from '../models/ChatMessage.js';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { collegeData } from '../data/collegeData.js';
import mongoose from 'mongoose';

// Common stopwords to filter out from user query for accurate keyword matching
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'in', 'on', 'at',
  'to', 'for', 'of', 'with', 'by', 'about', 'give', 'tell', 'me', 'what',
  'which', 'how', 'many', 'much', 'can', 'you', 'please', 'show', 'do', 'does',
  'i', 'want', 'know', 'get', 'any', 'details', 'info', 'information', 'regarding'
]);

// Conversational greetings matcher
const GREETING_WORDS = new Set(['hi', 'hello', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening', 'hola']);

// Intelligent search over college knowledge base
const findBestCollegeAnswer = async (userQuery) => {
  const queryClean = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const rawWords = queryClean.split(/\s+/).filter(w => w.length > 0);

  // 1. Check for simple conversational greetings
  if (rawWords.length <= 2 && rawWords.some(w => GREETING_WORDS.has(w))) {
    return {
      reply: `👋 **Hello! Welcome to Vignan's Lara Institute of Technology & Science (VLITS) Admissions & Enquiry Assistant.**\n\nI can help you with:\n• 📊 **AP EAMCET / EAPCET Cutoff Ranks**\n• 🎓 **B.Tech, M.Tech & MCA Courses**\n• 💰 **Fee Structure & Merit Scholarships**\n• 🚀 **Placement Statistics & Top Recruiters**\n• 🏢 **Hostel & Bus Transport Facilities**\n• 📋 **Admission Procedure & Management Quota**\n\nWhat would you like to know today?`,
      category: 'general'
    };
  }

  // Filter significant keywords
  const queryTokens = rawWords.filter(w => !STOP_WORDS.has(w) && w.length >= 2);
  const searchTokens = queryTokens.length > 0 ? queryTokens : rawWords;

  try {
    // Check MongoDB KnowledgeBase if connected, otherwise fallback to in-memory collegeData
    const dbDocs = mongoose.connection.readyState === 1
      ? await KnowledgeBase.find({}).lean()
      : [];
    const sourceData = dbDocs.length > 0 ? dbDocs : collegeData;

    let bestMatch = null;
    let highestScore = 0;

    for (const item of sourceData) {
      let score = 0;
      let matchedTokensCount = 0;

      const itemKeywords = (item.keywords || []).map(k => k.toLowerCase());
      const itemQuestion = (item.question || '').toLowerCase();
      const itemAnswer = (item.answer || '').toLowerCase();

      // A. Check exact multi-word keyword match in the query (e.g., "cutoff rank", "fee structure")
      for (const kw of itemKeywords) {
        if (queryClean.includes(kw)) {
          score += 6;
          matchedTokensCount += 2;
        }
      }

      // B. Token-level matching against keywords and question
      for (const token of searchTokens) {
        let tokenMatched = false;

        for (const kw of itemKeywords) {
          if (kw === token) {
            score += 4;
            tokenMatched = true;
          } else if (kw.includes(token) || token.includes(kw)) {
            score += 2;
            tokenMatched = true;
          }
        }

        if (itemQuestion.includes(token)) {
          score += 2.5;
          tokenMatched = true;
        }

        if (itemAnswer.includes(token)) {
          score += 0.5;
        }

        if (tokenMatched) {
          matchedTokensCount++;
        }
      }

      // ONLY grant priority bonus if at least one meaningful token or keyword matched!
      if (matchedTokensCount > 0 && score > 0) {
        score += (item.priority || 1) * 0.15;

        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
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

  // Dynamic intelligent fallback when no direct answer is found
  return {
    reply: `I couldn't find an exact match for your query: *"**${userQuery}**"*\n\n` +
      `Here are the most common areas I can help you with:\n` +
      `• **Cutoffs:** Expected AP EAPCET closing ranks for CSE, AIML, Data Science, ECE, IT, ME, CE.\n` +
      `• **Admissions:** Category-A (EAPCET counseling - Code: **LARA**) & Category-B (Management Quota).\n` +
      `• **Placements:** 85%+ campus placement record, highest ₹24 LPA, top recruiters TCS, Infosys, Amazon.\n` +
      `• **Hostel & Transport:** 40+ bus routes across Guntur/Vijayawada and on-campus separate hostels.\n\n` +
      `For specialized assistance, please contact the **VLITS Admissions Desk** directly:\n` +
      `📞 **+91-863-2381200** / **+91-98499 66066** | 📧 **admissions@vignanlara.org**`,
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
