const mongoose = require('mongoose');

const inspectLocal = async () => {
  try {
    const localUri = 'mongodb://localhost:27017/online_voting_system';
    await mongoose.connect(localUri);
    console.log('Connected to Local MongoDB.');

    // Import models
    const AuditLog = require('./models/AuditLog');
    const OtpVerification = require('./models/OtpVerification');
    const Student = require('./models/Student');

    // 1. Check latest 10 Audit Logs
    console.log('\n--- LATEST 10 LOCAL AUDIT LOGS ---');
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(10);
    console.log(JSON.stringify(logs, null, 2));

    // 2. Check active OTPs
    console.log('\n--- ACTIVE LOCAL OTPS ---');
    const otps = await OtpVerification.find();
    console.log(JSON.stringify(otps, null, 2));

    // 3. Count students
    const studentCount = await Student.countDocuments();
    console.log(`\nTotal Students in Local DB: ${studentCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Local Inspection failed:', err);
    process.exit(1);
  }
};

inspectLocal();
