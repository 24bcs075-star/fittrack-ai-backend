const mongoose = require('mongoose');

/**
 * Establishes connection to MongoDB using MONGO_URI from environment variables.
 * Exits the process on connection failure since the app cannot function without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
