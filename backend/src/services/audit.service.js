const AuditEvent = require('../modules/audit/audit.model');

// Fire-and-forget by design: a failed audit write should never break the
// actual request. We log the failure to the console (Winston picks it up via
// the morgan/console transport) and move on.
const logEvent = async ({
  eventType,
  actorId = null,
  targetId = null,
  ipAddress = null,
  deviceFingerprint = null,
  metadata = {},
  beforeState = null,
  afterState = null,
}) => {
  try {
    await AuditEvent.create({
      event_type: eventType,
      actor_id: actorId,
      target_id: targetId,
      ip_address: ipAddress,
      device_fingerprint: deviceFingerprint,
      metadata,
      before_state: beforeState,
      after_state: afterState,
    });
  } catch (err) {
    console.error(`Audit log write failed: ${err.message}`);
  }
};

module.exports = { logEvent };