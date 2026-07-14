const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  performedBy: { type: String, required: true }, // username or IP
  action: { type: String, required: true },
  ip: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
