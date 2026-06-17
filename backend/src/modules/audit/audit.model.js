const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema({
  event_type: { type: String, required: true, index: true },
  actor_id: { type: Number, default: null, index: true },
  target_id: { type: Number, default: null },
  ip_address: { type: String, default: null },
  device_fingerprint: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  before_state: { type: mongoose.Schema.Types.Mixed, default: null },
  after_state: { type: mongoose.Schema.Types.Mixed, default: null },
  timestamp: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('AuditEvent', auditEventSchema);