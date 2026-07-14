require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');

const generatePasswordsExcel = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in backend/.env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database.');

    // Connect to the raw studentdata database
    const rawDb = mongoose.connection.useDb('studentdata');
    const rawCollection = rawDb.collection('details');

    const rawStudents = await rawCollection.find({}).toArray();
    console.log(`Found ${rawStudents.length} student records in 'studentdata.details' collection.`);

    if (rawStudents.length === 0) {
      console.log('No student records found to process.');
      process.exit(0);
    }

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students Passwords');

    // Define columns
    worksheet.columns = [
      { header: 'Roll Number', key: 'rollNumber', width: 20 },
      { header: 'Student Name', key: 'name', width: 30 },
      { header: 'Personal Email ID', key: 'email', width: 35 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Generated Password', key: 'password', width: 25 }
    ];

    // Format headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAEAEA' }
    };

    // Add rows
    for (const raw of rawStudents) {
      const rollNo = (raw['Roll Number'] || '').trim();
      const name = (raw['Student Name'] || '').trim();
      const email = (raw['Personal Email ID'] || '').trim().toLowerCase();
      const dob = (raw['Date of Birth'] || '').trim();

      if (!rollNo || !name) {
        continue;
      }

      // Determine password: first two letters of name in uppercase + dob (without slashes)
      const firstTwo = name.slice(0, 2).toUpperCase();
      let plainPassword = firstTwo + dob.replace(/\//g, '').trim();
      if (!dob || !firstTwo) {
        plainPassword = 'Password123!';
      }

      worksheet.addRow({
        rollNumber: rollNo,
        name: name,
        email: email,
        dob: dob,
        password: plainPassword
      });
    }

    const outputPath = path.join(__dirname, 'students_passwords.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\nSuccess! Excel file generated at: ${outputPath}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    process.exit(1);
  }
};

generatePasswordsExcel();
