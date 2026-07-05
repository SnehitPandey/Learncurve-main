import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    process.exit(1);
  }
}
