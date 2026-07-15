const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['NOT_STARTED', 'RUNNING', 'ENDED'], default: 'NOT_STARTED' },
  resultsReleased: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Election', electionSchema);
