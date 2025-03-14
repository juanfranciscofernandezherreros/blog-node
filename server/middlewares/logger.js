// utils/logger.js
const Log = require('../models/Log');

async function createLog({ entity, action, entityId, performedBy, before, after }) {
  const logEntry = new Log({
    entity,
    action,
    entityId,
    performedBy,
    before,
    after
  });
  await logEntry.save();
}

module.exports = { createLog };
