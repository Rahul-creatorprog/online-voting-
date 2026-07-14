const express = require('express');
const multer = require('multer');
const path = require('path');
const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Setup Multer DiskStorage for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// GET /api/admin/candidates (Search or list by Election ID)
router.get('/', protect, adminOnly, async (req, res) => {
  const { electionId, search } = req.query;

  if (!electionId) {
    return res.status(400).json({ error: 'Validation Error', message: 'Election ID is required' });
  }

  try {
    let query = { election: electionId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registerNo: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await Candidate.find(query);
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/admin/candidates/:id (Get single candidate)
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Not Found', message: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/admin/candidates (Create candidate)
router.post('/', protect, adminOnly, upload.single('photo'), async (req, res) => {
  const { electionId, name, registerNo, department, year, position, manifesto } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!electionId || !name || !registerNo || !department || !year || !position) {
    return res.status(400).json({ error: 'Validation Error', message: 'Required fields are missing.' });
  }

  try {
    const photo = req.file ? req.file.filename : 'default-candidate.png';

    const candidate = await Candidate.create({
      election: electionId,
      name,
      registerNo: registerNo.toUpperCase(),
      department,
      year,
      position,
      manifesto,
      photo
    });

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Added Candidate: ${candidate.name} for position ${candidate.position}`,
      ip
    });

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/admin/candidates/:id (Update candidate)
router.put('/:id', protect, adminOnly, upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, registerNo, department, year, position, manifesto } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Not Found', message: 'Candidate not found' });
    }

    if (name) candidate.name = name;
    if (registerNo) candidate.registerNo = registerNo.toUpperCase();
    if (department) candidate.department = department;
    if (year) candidate.year = year;
    if (position) candidate.position = position;
    if (manifesto !== undefined) candidate.manifesto = manifesto;
    if (req.file) candidate.photo = req.file.filename;

    await candidate.save();

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Updated Candidate ID: ${id}`,
      ip
    });

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/admin/candidates/:id (Delete candidate)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const candidate = await Candidate.findByIdAndDelete(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Not Found', message: 'Candidate not found' });
    }

    await AuditLog.create({
      performedBy: req.user.username || req.user.fullName,
      action: `Deleted Candidate ID: ${id}`,
      ip
    });

    res.json({ message: 'Candidate deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
