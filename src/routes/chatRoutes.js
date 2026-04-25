var router = require('express').Router();
var Message = require('../models/Message');

router.get('/health', function(req, res) {
  res.json({ status: 'ok' });
});

router.get('/rooms/:room/messages', async function(req, res) {
  try {
    var messages = await Message.find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

module.exports = router;
