import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    keywords: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ],
    priority: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Full text search index
knowledgeBaseSchema.index({ question: 'text', answer: 'text', keywords: 'text' });

export const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
