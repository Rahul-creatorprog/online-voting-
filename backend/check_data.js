require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Student = require('./models/Student');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

const checkDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in backend/.env file');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    const adminCount = await Admin.countDocuments();
    const studentCount = await Student.countDocuments();
    const electionCount = await Election.countDocuments();
    const candidateCount = await Candidate.countDocuments();
    const voteCount = await Vote.countDocuments();

    console.log('\n--- COLLECTION STATS ---');
    console.log(`Admins: ${adminCount}`);
    console.log(`Students: ${studentCount}`);
    console.log(`Elections: ${electionCount}`);
    console.log(`Candidates: ${candidateCount}`);
    console.log(`Votes Cast: ${voteCount}`);

    if (studentCount > 0) {
      console.log('\n--- SAMPLE STUDENTS (First 5) ---');
      const students = await Student.find({}, { password: 0 }).limit(5);
      students.forEach((student, index) => {
        console.log(`${index + 1}. Register No: ${student.registerNo} | Name: ${student.name} | Dept: ${student.department} | Year: ${student.year} | Status: ${student.status}`);
      });
    } else {
      console.log('\nNo students found in the database.');
    }

    if (electionCount > 0) {
      console.log('\n--- ELECTIONS ---');
      const elections = await Election.find().limit(5);
      elections.forEach((election, index) => {
        console.log(`${index + 1}. Title: ${election.title} | Status: ${election.status} | Start: ${election.startTime} | End: ${election.endTime}`);
      });
    }

    if (candidateCount > 0) {
      console.log('\n--- SAMPLE CANDIDATES (First 5) ---');
      const candidates = await Candidate.find().limit(5);
      candidates.forEach((candidate, index) => {
        console.log(`${index + 1}. Name: ${candidate.name} | Register No: ${candidate.registerNo} | Position: ${candidate.position}`);
      });
    }

    console.log('\nCheck completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error connecting or checking database:', error);
    process.exit(1);
  }
};

checkDatabase();
