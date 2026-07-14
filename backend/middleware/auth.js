const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized', message: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_voting_system_123!');
    
    if (decoded.role === 'ADMIN') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ error: 'Not authorized', message: 'Admin account not found' });
      }
      req.user = admin;
      req.user.role = 'ADMIN';
    } else {
      const student = await Student.findById(decoded.id).select('-password');
      if (!student) {
        return res.status(401).json({ error: 'Not authorized', message: 'Student account not found' });
      }
      req.user = student;
      req.user.role = 'STUDENT';
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized', message: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden', message: 'Access restricted to administrators' });
  }
};

module.exports = { protect, adminOnly };
