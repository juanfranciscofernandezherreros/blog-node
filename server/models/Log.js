// models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  entity: { type: String, required: true },       
  action: { type: String, required: true },       
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  timestamp: { type: Date, default: Date.now },
  before: { type: Object },                       
  after: { type: Object },                        
});

module.exports = mongoose.model('Log', logSchema);
