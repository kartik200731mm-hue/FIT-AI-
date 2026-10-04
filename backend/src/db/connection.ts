import mongoose from 'mongoose';
import { ENV } from '../config/env';

export async function connectDB(): Promise<boolean> {
  try {
    if (!ENV.MONGODB_URI) {
      console.log('ℹ️ No MONGODB_URI provided. Running in persistent embedded storage mode.');
      return false;
    }
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('✅ Connected to MongoDB database successfully.');
    return true;
  } catch (error) {
    console.log('ℹ️ MongoDB connection not established or local service offline. Fit AI is running with persistent JSON-backed local database.');
    return false;
  }
}
