var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
  room:      { type: String, required: true },
  username:  { type: String, required: true },
  text:      { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
