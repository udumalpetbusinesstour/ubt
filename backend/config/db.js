const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MONGODB CONNECTION WARNING: ${error.message}`);
    console.warn(`Backend server will remain active. To resolve, configure a valid cloud MONGO_URI in backend/.env`);
  }
};

module.exports = connectDB;
