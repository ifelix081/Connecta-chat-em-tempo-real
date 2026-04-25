require('dotenv').config();
var express = require('express');
var http = require('http');
var Server = require('socket.io').Server;
var cors = require('cors');
var path = require('path');
var connectDB = require('./src/config/database');
var chatRoutes = require('./src/routes/chatRoutes');
var chatSocket = require('./src/sockets/chatSocket');

connectDB();

var app = express();
var server = http.createServer(app);
var io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', chatRoutes);

chatSocket(io);

var PORT = process.env.PORT || 3000;
server.listen(PORT, function() {
  console.log('Servidor rodando na porta ' + PORT);
});
