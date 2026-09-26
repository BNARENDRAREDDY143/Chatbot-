import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Can be null/guest
      index: true
    },
    sessionId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true
    },
    reply: {
      type: String,
      required: [true, 'Bot reply is required'],
      trim: true
    },
    category: {
      type: String,
      enum: [
        'admissions',
        'courses',
        'fees',
        'placements',
        'hostel',
        'faculty',
        'campus',
        'transport',
        'exams',
        'general'
      ],
      default: 'general'
    },
    isFeedbackHelpful: {
      type: Boolean,
      default: null
    },
    attachment: {
      fileName: { type: String },
      fileType: { type: String },
      fileSize: { type: Number },
      fileUrl: { type: String }
    }
  },
  {
    timestamps: true
  }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
