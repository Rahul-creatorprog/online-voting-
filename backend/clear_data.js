require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');
const ElectionParticipation = require('./models/ElectionParticipation');
const OtpVerification = require('./models/OtpVerification');
const AuditLog = require('./models/AuditLog');

const clearData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in .env file');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // Delete collections to clear demo data
    const studentRes = await Student.deleteMany({});
    console.log(`Cleared Student collection (${studentRes.deletedCount} documents deleted).`);

    const electionRes = await Election.deleteMany({});
    console.log(`Cleared Election collection (${electionRes.deletedCount} documents deleted).`);

    const candidateRes = await Candidate.deleteMany({});
    console.log(`Cleared Candidate collection (${candidateRes.deletedCount} documents deleted).`);

    const voteRes = await Vote.deleteMany({});
    console.log(`Cleared Vote collection (${voteRes.deletedCount} documents deleted).`);

    const participationRes = await ElectionParticipation.deleteMany({});
    console.log(`Cleared ElectionParticipation collection (${participationRes.deletedCount} documents deleted).`);

    const otpRes = await OtpVerification.deleteMany({});
    console.log(`Cleared OtpVerification collection (${otpRes.deletedCount} documents deleted).`);

    const auditRes = await AuditLog.deleteMany({});
    console.log(`Cleared AuditLog collection (${auditRes.deletedCount} documents deleted).`);

    console.log('Database cleanup completed successfully. Only your own data will be used now.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearData();
