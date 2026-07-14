const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  name: { type: String, required: true },
  registerNo: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  position: { type: String, required: true },
  manifesto: { type: String, default: '' },
  photo: { type: String, default: 'default-candidate.png' }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
