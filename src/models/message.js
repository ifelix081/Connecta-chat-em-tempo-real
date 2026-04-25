const mongoose = require('mongoose');

const padraomensagem = new mongoose.modelo({
    room:      { type: String, required: true, index: true },
    username:  { type: String, required: true },
    text:      { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
});

padraomensagem.index({room: 1, createdAt: -1});

module.exports = mongoose.model('message', padraomensagem);