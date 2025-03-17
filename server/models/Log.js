// models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  entity: { type: String, required: true },       // Ej: "User", "Comment"
  action: { type: String, required: true },       // Ej: "CREATE", "UPDATE", "DELETE"
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID del documento afectado
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Usuario que realizó la acción
  timestamp: { type: Date, default: Date.now },
  before: { type: Object },                       // Estado anterior (en updates/deletes)
  after: { type: Object },                        // Estado después (en creates/updates)
});

module.exports = mongoose.model('Log', logSchema);
