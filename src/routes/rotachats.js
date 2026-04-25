const router = require('express').Router();
const { get } = require('mongoose');
const message = require('../models/Message');

router.get('/health', (req, res) => res.json({status: 'ok'}));

router.get('/rooms/:room/messages', async   (req, res) => {
    try{
        const messages = await message.find({ room: req.params.room})
            .sort({createdAt: -1})
            .limit(50);
        res.json(messages.reverse());
    } catch (err) {
        res.status(500).json({message: 'Erro ao buscar mensagens'});
    }
});

module.exports = router;