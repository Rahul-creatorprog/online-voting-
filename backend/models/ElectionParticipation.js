const mongoose = require('mongoose');

const electionParticipationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true }
}, { timestamps: true });

electionParticipationSchema.index({ student: 1, election: 1 }, { unique: true });

module.exports = mongoose.model('ElectionParticipation', electionParticipationSchema);
