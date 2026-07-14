const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  registerNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  status: { type: String, enum: ['ENABLED', 'DISABLED'], default: 'ENABLED' },
  photo: { type: String, default: null },
  dob: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
