const express = require('express');
const Election = require('../models/Election');
const Student = require('../models/Student');
const Candidate = require('../models/Candidate');
const ElectionParticipation = require('../models/ElectionParticipation');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/elections (List all elections)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/elections/:id (Get single election)
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Not Found', message: 'Election not found' });
    }
    res.json(election);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/elections (Create election)
router.post('/', protect, adminOnly, async (req, res) => {
  const { title, startTime, endTime } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Validation Error', message: 'Title, start time, and end time are required' });
  }

  try {
    const newElection = await Election.create({
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'NOT_STARTED'
    });

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Created Election: ${newElection.title}`,
      ip
    });

    res.status(201).json(newElection);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/admin/elections/:id (Update election)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { title, startTime, endTime } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const election = await Election.findById(id);
    if (!election) {
      return res.status(404).json({ error: 'Not Found', message: 'Election not found.' });
    }

    if (title) election.title = title;
    if (startTime) election.startTime = new Date(startTime);
    if (endTime) election.endTime = new Date(endTime);

    await election.save();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Updated Election: ${election.title}`,
      ip
    });

    res.json(election);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/elections/:id/status (Change status)
router.post('/:id/status', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!['NOT_STARTED', 'RUNNING', 'ENDED'].includes(status)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid election status' });
  }

  try {
    const election = await Election.findById(id);
    if (!election) {
      return res.status(404).json({ error: 'Not Found', message: 'Election not found.' });
    }

    // If setting to RUNNING, verify no other election is currently active
    if (status === 'RUNNING') {
      const runningElection = await Election.findOne({ status: 'RUNNING', _id: { $ne: id } });
      if (runningElection) {
        return res.status(400).json({ error: 'Bad Request', message: `Election "${runningElection.title}" is already running.` });
      }
    }

    election.status = status;
    await election.save();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Changed status of Election '${election.title}' to ${election.status}`,
      ip
    });

    res.json(election);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/admin/elections/:id (Delete election)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const election = await Election.findByIdAndDelete(id);
    if (!election) {
      return res.status(404).json({ error: 'Not Found', message: 'Election not found.' });
    }

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Deleted Election ID: ${id}`,
      ip
    });

    res.json({ message: 'Election deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/public/election-status (Public status for widgets)
router.get('/public/status', async (req, res) => {
  try {
    // Find active (RUNNING) election
    const activeElection = await Election.findOne({ status: 'RUNNING' });
    if (activeElection) {
      const totalStudents = await Student.countDocuments();
      const votesCast = await ElectionParticipation.countDocuments({ election: activeElection._id });
      const remainingStudents = Math.max(0, totalStudents - votesCast);

      res.json({
        active: true,
        title: activeElection.title,
        status: activeElection.status,
        endTime: activeElection.endTime,
        totalStudents,
        votesCast,
        remainingStudents
      });
    } else {
      res.json({
        active: false,
        title: 'No Active Election',
        status: 'INACTIVE',
        endTime: null,
        totalStudents: 0,
        votesCast: 0,
        remainingStudents: 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/elections/:id/release (Toggle Results Release)
router.post('/:id/release', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { released } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const election = await Election.findById(id);
    if (!election) {
      return res.status(404).json({ error: 'Not Found', message: 'Election not found.' });
    }

    election.resultsReleased = !!released;
    await election.save();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Changed results released status of Election '${election.title}' to ${election.resultsReleased}`,
      ip
    });

    res.json(election);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
