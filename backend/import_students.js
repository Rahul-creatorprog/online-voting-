require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/Student');

const importStudents = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in backend/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to target database.');

    // 1. Connect to the studentdata database to read raw imported data
    const rawDb = mongoose.connection.useDb('studentdata');
    const rawCollection = rawDb.collection('details');

    const rawStudents = await rawCollection.find({}).toArray();
    console.log(`Found ${rawStudents.length} raw student records in 'studentdata.details' collection.`);

    if (rawStudents.length === 0) {
      console.log('No raw students to import.');
      process.exit(0);
    }

    // 2. Clear existing sample students in the target database
    console.log('Clearing existing students in the voting system...');
    await Student.deleteMany({});
    console.log('Cleared existing students.');

    // 3. Process and map student records
    console.log('Processing and encrypting student accounts...');
    
    // Use a default password or Date of Birth for login
    // Let's use the student's Date of Birth (without slashes) as their password, e.g. "13/11/2006" -> password is "13112006"
    // And fallback to "Password123!" if Date of Birth is missing
    const preparedStudents = [];
    
    for (const raw of rawStudents) {
      const rollNo = raw['Roll Number'] || '';
      const name = raw['Student Name'] || '';
      const email = raw['Personal Email ID'] || '';
      const dob = raw['Date of Birth'] || '';

      if (!rollNo || !name || !email) {
        console.log(`Skipping invalid record: ${JSON.stringify(raw)}`);
        continue;
      }

      // Determine password: first two letters of name in capital letters + date of birth (without slashes, e.g. "ME13112006")
      const firstTwo = name.trim().slice(0, 2).toUpperCase();
      let plainPassword = firstTwo + dob.replace(/\//g, '').trim();
      if (!dob || !firstTwo) {
        plainPassword = 'Password123!';
      }

      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Determine Department and Year from Roll Number (e.g. "24BIT071")
      let department = 'Information Technology'; // Default for BIT
      if (rollNo.includes('BIT')) {
        department = 'Information Technology';
      } else if (rollNo.includes('CSE')) {
        department = 'Computer Science';
      }

      // Roll starting with "24" means admitted in 2024. In 2026, they are III Year (or II Year)
      let year = 'II Year'; 

      preparedStudents.push({
        registerNo: rollNo.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        department: department,
        year: year,
        status: 'ENABLED',
        dob: dob.trim()
      });
    }

    // 4. Insert records to Student collection
    const result = await Student.insertMany(preparedStudents);
    console.log(`Successfully imported ${result.length} student records into the database!`);
    
    console.log('\nSample credential for testing login:');
    if (preparedStudents.length > 0) {
      const sample = rawStudents[0];
      const name = sample['Student Name'] || '';
      const firstTwo = name.trim().slice(0, 2).toUpperCase();
      const dobStr = sample['Date of Birth'] || '';
      const cleanDob = firstTwo + dobStr.replace(/\//g, '').trim();
      console.log(`Roll Number (Username): ${sample['Roll Number']}`);
      console.log(`Password: ${cleanDob}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

importStudents();
