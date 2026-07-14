const express = require('express');
const Election = require('../models/Election');
const Student = require('../models/Student');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const ElectionParticipation = require('../models/ElectionParticipation');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/voting/active-election (Get active election & student status)
router.get('/active-election', protect, async (req, res) => {
  try {
    const election = await Election.findOne({ status: 'RUNNING' });
    if (!election) {
      return res.status(404).json({ message: 'No active election currently running.' });
    }

    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Forbidden. Admin cannot vote.' });
    }

    const studentId = req.user._id;
    const hasVoted = await ElectionParticipation.exists({ student: studentId, election: election._id });
    const candidates = await Candidate.find({ election: election._id });

    res.json({
      election,
      hasVoted: !!hasVoted,
      candidates
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/voting/cast (Cast ballot)
router.post('/cast', protect, async (req, res) => {
  const { electionId, candidateIds } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Forbidden', message: 'Only students can cast ballots.' });
  }

  const student = req.user;

  try {
    // 1. Verify election exists and is currently RUNNING
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Not Found', message: 'Election not found.' });
    }

    if (election.status !== 'RUNNING') {
      return res.status(400).json({ error: 'Bad Request', message: `Voting is not active for this election. Status: ${election.status}` });
    }

    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      if (now > election.endTime) {
        election.status = 'ENDED';
        await election.save();
      }
      return res.status(400).json({ error: 'Bad Request', message: 'Election voting period has ended or not yet started.' });
    }

    // 2. Verify student is enabled
    if (student.status !== 'ENABLED') {
      return res.status(403).json({ error: 'Forbidden', message: 'Your student account is currently disabled. Please contact the admin.' });
    }

    // 3. Verify student has not already voted
    const alreadyVoted = await ElectionParticipation.exists({ student: student._id, election: electionId });
    if (alreadyVoted) {
      return res.status(400).json({ error: 'Bad Request', message: 'You have already voted in this election.' });
    }

    // 4. Validate candidate selections
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'Please select candidates to vote.' });
    }

    const votedPositions = new Set();
    const votesToCreate = [];

    for (const candidateId of candidateIds) {
      const candidate = await Candidate.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({ error: 'Not Found', message: `Selected candidate ID ${candidateId} not found.` });
      }

      if (candidate.election.toString() !== electionId.toString()) {
        return res.status(400).json({ error: 'Bad Request', message: `Candidate "${candidate.name}" is not registered in this election.` });
      }

      if (votedPositions.has(candidate.position)) {
        return res.status(400).json({ error: 'Bad Request', message: `Duplicate votes detected for position: ${candidate.position}. You can only vote once per position.` });
      }

      votedPositions.add(candidate.position);
      votesToCreate.push({
        election: electionId,
        candidate: candidateId,
        position: candidate.position
      });
    }

    // 5. Record Student Participation
    await ElectionParticipation.create({
      student: student._id,
      election: electionId
    });

    // 6. Save Anonymous Votes
    await Vote.insertMany(votesToCreate);

    await AuditLog.create({
      performedBy: student.registerNo,
      action: 'Cast Ballot successfully',
      ip
    });

    res.json({ message: 'Thank you. Your vote has been recorded successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
