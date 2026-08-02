require('dotenv').config();
const mongoose = require('mongoose');
const { cleanupIncompleteRegistrations } = require('./cron/incompleteRegistrationsCleanupCron');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const runTest = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');
    await cleanupIncompleteRegistrations();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTest();
