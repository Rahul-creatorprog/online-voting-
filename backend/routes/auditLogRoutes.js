const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/audit-logs
router.get('/', protect, adminOnly, async (req, res) => {
  const { page = 0, size = 15 } = req.query;
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);

  try {
    const totalElements = await AuditLog.countDocuments();
    const content = await AuditLog.find()
      .sort({ timestamp: -1 })
      .skip(pageNum * sizeNum)
      .limit(sizeNum);

    res.json({
      content,
      totalElements,
      totalPages: Math.ceil(totalElements / sizeNum),
      number: pageNum,
      size: sizeNum
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
