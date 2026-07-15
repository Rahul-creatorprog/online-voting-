require('dotenv').config();
const mongoose = require('mongoose');

const inspect = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI not found in env.');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Import models
    const AuditLog = require('./models/AuditLog');
    const OtpVerification = require('./models/OtpVerification');
    const Student = require('./models/Student');

    // 1. Check latest 10 Audit Logs
    console.log('\n--- LATEST 10 AUDIT LOGS ---');
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(10);
    console.log(JSON.stringify(logs, null, 2));

    // 2. Check active OTPs
    console.log('\n--- ACTIVE OTPS ---');
    const otps = await OtpVerification.find();
    console.log(JSON.stringify(otps, null, 2));

    // 3. Count students
    const studentCount = await Student.countDocuments();
    console.log(`\nTotal Students in DB: ${studentCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err);
    process.exit(1);
  }
};

inspect();
