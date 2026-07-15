const http = require('http');
require('dotenv').config();
const mongoose = require('mongoose');
const OtpVerification = require('./models/OtpVerification');
const Student = require('./models/Student');

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find a student who hasn't voted yet
    const student = await Student.findOne({ registerNo: '24BIT071' });
    if (!student) {
      console.error('Student not found.');
      process.exit(1);
    }

    console.log('--- 1. LOGIN ---');
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: student.registerNo,
      password: 'ME13112006'
    });

    console.log('Login Response:', loginRes);

    console.log('\n--- 2. GET OTP ---');
    const verificationRecord = await OtpVerification.findOne({ email: student.email });
    if (!verificationRecord) {
      console.error('OTP record not found in database.');
      process.exit(1);
    }
    const otp = verificationRecord.otp;
    console.log(`Found OTP: ${otp}`);

    console.log('\n--- 3. VERIFY OTP ---');
    const verifyRes = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/otp/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: student.email,
      otp: otp
    });

    console.log('Verify Response:', verifyRes);

    const token = verifyRes.data.token;

    console.log('\n--- 4. CAST BALLOT ---');
    const castRes = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/voting/cast',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      electionId: '6a572f303a32032f13b45fb0',
      candidateIds: [
        '6a572f6d3a32032f13b45fbc',
        '6a572fa73a32032f13b45fc5',
        '6a572fd73a32032f13b45fce'
      ]
    });

    console.log('Cast Response:', castRes);
    process.exit(0);
  } catch (err) {
    console.error('Test threw an error:', err);
    process.exit(1);
  }
};

runTest();
