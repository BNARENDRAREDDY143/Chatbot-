import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { collegeData } from '../data/collegeData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lara_college_chatbot';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing knowledge base
    await KnowledgeBase.deleteMany({});
    console.log('Cleared existing KnowledgeBase records.');

    // Insert college data
    const inserted = await KnowledgeBase.insertMany(collegeData);
    console.log(`✅ Successfully seeded ${inserted.length} college knowledge base items!`);

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
