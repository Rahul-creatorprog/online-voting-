const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  position: { type: String, required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Vote', voteSchema);
