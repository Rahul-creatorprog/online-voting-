const http = require('http');
require('dotenv').config();
const mongoose = require('mongoose');
const OtpVerification = require('./models/OtpVerification');

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: body ? JSON.parse(body) : null
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
    console.log('--- 1. ATTEMPTING LOGIN ---');
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: '24BIT071',
      password: 'ME13112006'
    });

    console.log('Login Response:', loginRes);

    if (loginRes.statusCode !== 200) {
      console.error('Login failed, exiting test.');
      process.exit(1);
    }

    console.log('\n--- 2. RETRIEVING OTP FROM DB ---');
    await mongoose.connect(process.env.MONGODB_URI);
    const verificationRecord = await OtpVerification.findOne({ email: 'mehaskm@gmail.com' });
    if (!verificationRecord) {
      console.error('OTP record not found in database. Exiting.');
      process.exit(1);
    }
    const otp = verificationRecord.otp;
    console.log(`Found OTP in DB: ${otp}`);

    console.log('\n--- 3. VERIFYING OTP ---');
    const verifyRes = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/otp/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'mehaskm@gmail.com',
      otp: otp
    });

    console.log('Verify Response:', verifyRes);

    if (verifyRes.statusCode !== 200) {
      console.error('OTP verification failed, exiting test.');
      process.exit(1);
    }

    const token = verifyRes.data.token;
    console.log(`JWT Token: ${token}`);

    console.log('\n--- 4. CHECKING AUTH STATUS ---');
    const statusRes = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/status',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status Response:', statusRes);

    if (statusRes.statusCode === 200) {
      console.log('\nSUCCESS: ALL AUTHENTICATION STEPS COMPLETED CORRECTLY!');
    } else {
      console.error('\nFAILURE: Status endpoint returned error status code.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Test threw an error:', err);
    process.exit(1);
  }
};

runTest();
