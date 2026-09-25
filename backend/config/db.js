import mongoose from 'mongoose';

export const connectDB = async () => {
  // Keep fallback endpoints responsive if MongoDB is offline.
  mongoose.set('bufferCommands', false);

  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lara_college_chatbot',
      { serverSelectionTimeoutMS: 5000 }
    );
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn('MongoDB is unavailable; persistence is disabled and fallback FAQ answers remain available.');
    return null;
  }
};
