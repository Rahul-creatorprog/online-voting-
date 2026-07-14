const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/student/change-password
router.post('/student/change-password', protect, async (req, res) => {
  const { password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Forbidden', message: 'Only students can change student password' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must contain at least 8 characters.' });
  }

  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found.' });
    }

    student.password = await bcrypt.hash(password, 10);
    await student.save();

    await AuditLog.create({
      performedBy: student.registerNo,
      action: 'Student changed their password',
      ip
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/change-password
router.post('/admin/change-password', protect, async (req, res) => {
  const { password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: 'Only admins can access this route' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must contain at least 8 characters.' });
  }

  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ error: 'Not Found', message: 'Admin not found.' });
    }

    admin.password = await bcrypt.hash(password, 10);
    await admin.save();

    await AuditLog.create({
      performedBy: admin.username,
      action: 'Admin changed password',
      ip
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
