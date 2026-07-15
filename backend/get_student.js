require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

const findStudent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const student = await Student.findOne({});
    if (student) {
      console.log('Sample Student Details:');
      console.log(`Register No: ${student.registerNo}`);
      console.log(`Name: ${student.name}`);
      console.log(`Email: ${student.email}`);
      console.log(`DOB: ${student.dob}`);
    } else {
      console.log('No students found.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findStudent();
