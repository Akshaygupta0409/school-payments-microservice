import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school-payments';

const connectDB = async () => {
  try {
    // Connect to MongoDB without deprecated options
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
    console.log(mongoURI);
    
  } catch (error) {
    console.error(error.message);
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
