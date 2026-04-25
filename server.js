require('dotenv').config();
    const express = require('express');
    const http = require('http');
    const { Server } = require('socket.io');
    const cors = require('cors');
    const path = require('path');

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST']}
        });

    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log('Servidor rodando na porta ${PORT}');
        });

    module.exports = {io};