const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const OtpVerification = require('../models/OtpVerification');
const AuditLog = require('../models/AuditLog');
const { sendOtpEmail } = require('../services/emailService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate Random 6 digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!username || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Register Number and Password are required' });
  }

  try {
    const student = await Student.findOne({ registerNo: username.toUpperCase() });
    if (!student) {
      await AuditLog.create({ performedBy: username, action: 'Failed login attempt - User not found', ip });
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid register number or password.' });
    }

    if (student.status === 'DISABLED') {
      await AuditLog.create({ performedBy: username, action: 'Login blocked - Account disabled', ip });
      return res.status(403).json({ error: 'Forbidden', message: 'Your account is disabled. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      await AuditLog.create({ performedBy: username, action: 'Failed login attempt - Invalid password', ip });
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid register number or password.' });
    }

    // Generate and send OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await OtpVerification.findOneAndUpdate(
      { email: student.email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    const emailSent = await sendOtpEmail(student.email, otp);
    if (!emailSent) {
      console.log(`[SMTP FAILED] Falling back to demo OTP 123456 for ${student.email}`);
      await OtpVerification.findOneAndUpdate(
        { email: student.email },
        { otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
        { upsert: true }
      );
      return res.json({ message: 'OTP dispatch simulated. For testing, use code: 123456', email: student.email });
    }

    await AuditLog.create({ performedBy: student.registerNo, action: 'Student login initiated - OTP dispatched', ip });
    
    // We send back success message.
    res.json({ message: 'Login successful. OTP sent to your registered email.', email: student.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/auth/otp/verify
router.post('/otp/verify', async (req, res) => {
  const { email, otp } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and OTP are required' });
  }

  try {
    const record = await OtpVerification.findOne({ email });
    if (!record || record.otp !== otp) {
      await AuditLog.create({ performedBy: email, action: 'OTP mismatch', ip });
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid OTP code. Please try again.' });
    }

    // OTP matches! Get Student
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found.' });
    }

    // Delete used OTP
    await OtpVerification.deleteOne({ email });

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, role: 'STUDENT' },
      process.env.JWT_SECRET || 'super_secret_jwt_key_voting_system_123!',
      { expiresIn: '1h' }
    );

    await AuditLog.create({ performedBy: student.registerNo, action: 'OTP verified successfully', ip });

    res.json({
      token,
      role: 'STUDENT',
      student: {
        id: student._id,
        registerNo: student.registerNo,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        photo: student.photo
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/auth/otp/resend
router.post('/otp/resend', async (req, res) => {
  const { email } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!email) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email is required' });
  }

  try {
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await OtpVerification.findOneAndUpdate(
      { email: student.email },
      { otp, expiresAt },
      { upsert: true }
    );

    const emailSent = await sendOtpEmail(student.email, otp);
    if (!emailSent) {
      console.log(`[SMTP FAILED] Falling back to demo OTP 123456 for ${student.email}`);
      await OtpVerification.findOneAndUpdate(
        { email: student.email },
        { otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
        { upsert: true }
      );
      return res.json({ message: 'OTP dispatch simulated. For testing, use code: 123456' });
    }

    await AuditLog.create({ performedBy: student.registerNo, action: 'OTP resent', ip });
    res.json({ message: 'OTP resent successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!username || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Username and Password are required' });
  }

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      await AuditLog.create({ performedBy: username, action: 'Failed Admin login attempt - User not found', ip });
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      await AuditLog.create({ performedBy: username, action: 'Failed Admin login attempt - Invalid password', ip });
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid admin credentials.' });
    }

    // Create JWT Token (Admin skips OTP)
    const token = jwt.sign(
      { id: admin._id, role: 'ADMIN' },
      process.env.JWT_SECRET || 'super_secret_jwt_key_voting_system_123!',
      { expiresIn: '4h' }
    );

    await AuditLog.create({ performedBy: admin.username, action: 'Admin login successful', ip });

    res.json({
      token,
      role: 'ADMIN',
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/auth/status
router.get('/status', protect, async (req, res) => {
  if (req.user.role === 'ADMIN') {
    res.json({
      loggedIn: true,
      role: 'ADMIN',
      admin: {
        id: req.user._id,
        username: req.user.username,
        fullName: req.user.fullName,
        email: req.user.email
      }
    });
  } else {
    res.json({
      loggedIn: true,
      role: 'STUDENT',
      student: {
        id: req.user._id,
        registerNo: req.user.registerNo,
        name: req.user.name,
        email: req.user.email,
        department: req.user.department,
        year: req.user.year,
        photo: req.user.photo
      }
    });
  }
});

module.exports = router;
