#!/bin/bash

echo "🚀 Criando o projeto Connecta Chat..."

# Estrutura de pastas
mkdir -p src/config src/models src/routes src/sockets public

# ── package.json ──────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "connecta-chat-em-tempo-real",
  "version": "1.0.0",
  "description": "Chat em tempo real com Node.js, Express e Socket.IO",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "mongoose": "^8.4.1",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "socket.io-client": "^4.7.5",
    "supertest": "^7.0.0"
  }
}
EOF

# ── .gitignore ─────────────────────────────────────────────
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
EOF

# ── .env ───────────────────────────────────────────────────
cat > .env << 'EOF'
PORT=3000
MONGODB_URI=mongodb://localhost:27017/connecta-chat
NODE_ENV=development
EOF

# ── server.js ──────────────────────────────────────────────
cat > server.js << 'EOF'
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
EOF

# ── src/config/database.js ─────────────────────────────────
cat > src/config/database.js << 'EOF'
var mongoose = require('mongoose');

var connectDB = async function() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Erro ao conectar no banco: ' + err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
EOF

# ── src/models/Message.js ──────────────────────────────────
cat > src/models/Message.js << 'EOF'
var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
  room:      { type: String, required: true },
  username:  { type: String, required: true },
  text:      { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
EOF

# ── src/routes/chatRoutes.js ───────────────────────────────
cat > src/routes/chatRoutes.js << 'EOF'
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
EOF

# ── src/sockets/chatSocket.js ──────────────────────────────
cat > src/sockets/chatSocket.js << 'EOF'
var Message = require('../models/Message');

var roomUsers = new Map();

function getUserList(room) {
  return Array.from(roomUsers.get(room) ? roomUsers.get(room).values() : []);
}

module.exports = function(io) {
  io.on('connection', function(socket) {
    console.log('Conectado: ' + socket.id);

    socket.on('join_room', async function(data) {
      var username = data.username;
      var room = data.room;

      Array.from(socket.rooms)
        .filter(function(r) { return r !== socket.id; })
        .forEach(function(r) { socket.leave(r); });

      socket.join(room);
      socket.data = { username: username, room: room };

      if (!roomUsers.has(room)) roomUsers.set(room, new Map());
      roomUsers.get(room).set(socket.id, username);

      try {
        var history = await Message.find({ room: room })
          .sort({ createdAt: -1 })
          .limit(50);
        socket.emit('message_history', history.reverse());
      } catch (err) {
        console.error('Erro ao buscar historico: ' + err.message);
      }

      socket.to(room).emit('user_joined', { username: username, users: getUserList(room) });
      socket.emit('room_users', getUserList(room));
      console.log(username + ' entrou na sala ' + room);
    });

    socket.on('send_message', async function(data) {
      var text = data.text;
      var socketData = socket.data || {};
      var username = socketData.username;
      var room = socketData.room;
      if (!username || !room || !text || !text.trim()) return;

      try {
        var msg = new Message({ room: room, username: username, text: text.trim() });
        await msg.save();
        io.to(room).emit('new_message', {
          _id: msg._id,
          username: username,
          text: msg.text,
          createdAt: msg.createdAt
        });
      } catch (err) {
        console.error('Erro ao salvar mensagem: ' + err.message);
      }
    });

    socket.on('typing', function(isTyping) {
      var socketData = socket.data || {};
      var username = socketData.username;
      var room = socketData.room;
      if (!room) return;
      socket.to(room).emit('user_typing', { username: username, isTyping: isTyping });
    });

    socket.on('disconnect', function() {
      var socketData = socket.data || {};
      var username = socketData.username;
      var room = socketData.room;
      if (!room) return;
      if (roomUsers.get(room)) roomUsers.get(room).delete(socket.id);
      io.to(room).emit('user_left', { username: username, users: getUserList(room) });
      console.log(username + ' saiu da sala ' + room);
    });
  });
};
EOF

# ── public/index.html ──────────────────────────────────────
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connecta Chat</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="login-screen">
    <div class="login-card">
      <h1>💬 Connecta</h1>
      <p>Chat em tempo real</p>
      <input id="username-input" type="text" placeholder="Seu nome" maxlength="30" />
      <input id="room-input" type="text" placeholder="Nome da sala" maxlength="30" />
      <button id="join-btn">Entrar</button>
    </div>
  </div>
  <div id="chat-screen" class="hidden">
    <aside id="sidebar">
      <div class="sidebar-header"><span id="room-name"></span></div>
      <h3>Online</h3>
      <ul id="users-list"></ul>
    </aside>
    <main id="chat-main">
      <div id="messages"></div>
      <div id="typing-indicator"></div>
      <form id="message-form">
        <input id="message-input" type="text" placeholder="Digite uma mensagem..." autocomplete="off" />
        <button type="submit">Enviar</button>
      </form>
    </main>
  </div>
  <script src="/socket.io/socket.io.js"></script>
  <script src="chat.js"></script>
</body>
</html>
EOF

# ── public/chat.js ─────────────────────────────────────────
cat > public/chat.js << 'EOF'
var socket = io({ transports: ['websocket', 'polling'] });
var typingTimer;

document.getElementById('join-btn').addEventListener('click', entrarNaSala);
document.getElementById('room-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') entrarNaSala();
});

function entrarNaSala() {
  var username = document.getElementById('username-input').value.trim();
  var room = document.getElementById('room-input').value.trim();
  if (!username || !room) return alert('Preencha seu nome e o nome da sala');
  socket.emit('join_room', { username: username, room: room });
  document.getElementById('room-name').textContent = '#' + room;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('chat-screen').classList.remove('hidden');
  document.getElementById('message-input').focus();
}

document.getElementById('message-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var input = document.getElementById('message-input');
  var text = input.value.trim();
  if (!text) return;
  socket.emit('send_message', { text: text });
  input.value = '';
});

document.getElementById('message-input').addEventListener('input', function() {
  socket.emit('typing', true);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(function() { socket.emit('typing', false); }, 1500);
});

socket.on('message_history', function(messages) {
  document.getElementById('messages').innerHTML = '';
  messages.forEach(addMessage);
});

socket.on('new_message', addMessage);
socket.on('room_users', updateUsers);

socket.on('user_joined', function(data) {
  addNotificacao(data.username + ' entrou na sala');
  updateUsers(data.users);
});

socket.on('user_left', function(data) {
  addNotificacao(data.username + ' saiu da sala');
  updateUsers(data.users);
});

socket.on('user_typing', function(data) {
  var el = document.getElementById('typing-indicator');
  el.textContent = data.isTyping ? data.username + ' esta digitando...' : '';
});

socket.on('disconnect', function() {
  addNotificacao('Conexao perdida. Reconectando...');
});

function addMessage(msg) {
  var div = document.createElement('div');
  div.className = 'message';
  var hora = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  var header = document.createElement('div');
  header.className = 'msg-header';
  var strong = document.createElement('strong');
  strong.textContent = msg.username;
  var time = document.createElement('time');
  time.textContent = hora;
  header.appendChild(strong);
  header.appendChild(time);
  var body = document.createElement('div');
  body.className = 'msg-body';
  body.textContent = msg.text;
  div.appendChild(header);
  div.appendChild(body);
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
}

function addNotificacao(texto) {
  var div = document.createElement('div');
  div.className = 'notificacao';
  div.textContent = texto;
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView({ behavior: 'smooth' });
}

function updateUsers(users) {
  var ul = document.getElementById('users-list');
  ul.innerHTML = '';
  users.forEach(function(u) {
    var li = document.createElement('li');
    li.textContent = u;
    ul.appendChild(li);
  });
}
EOF

# ── public/style.css ───────────────────────────────────────
cat > public/style.css << 'EOF'
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; height: 100vh; display: flex; align-items: center; justify-content: center; }
.hidden { display: none !important; }

#login-screen { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; }
.login-card { background: white; padding: 2.5rem 2rem; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 0.9rem; width: 320px; }
.login-card h1 { font-size: 1.8rem; text-align: center; color: #1a1a2e; }
.login-card p { text-align: center; color: #888; font-size: 0.9rem; margin-top: -0.4rem; }
.login-card input { padding: 0.75rem 1rem; border: 1.5px solid #e0e0e0; border-radius: 10px; font-size: 1rem; outline: none; }
.login-card input:focus { border-color: #4f46e5; }
.login-card button { padding: 0.85rem; background: #4f46e5; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 0.3rem; }
.login-card button:hover { background: #4338ca; }

#chat-screen { display: flex; width: 100vw; height: 100vh; }
#sidebar { width: 220px; background: #1a1a2e; color: white; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-header { padding: 1.2rem 1rem 0.8rem; font-size: 1rem; font-weight: 700; color: white; border-bottom: 1px solid rgba(255,255,255,0.08); }
#sidebar h3 { padding: 1rem 1rem 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
#users-list { list-style: none; padding: 0 0.75rem; display: flex; flex-direction: column; gap: 0.3rem; }
#users-list li { padding: 0.45rem 0.75rem; border-radius: 8px; font-size: 0.9rem; background: rgba(255,255,255,0.06); display: flex; align-items: center; gap: 0.5rem; }
#users-list li::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

#chat-main { flex: 1; display: flex; flex-direction: column; background: white; overflow: hidden; }
#messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
.message { max-width: 65%; display: flex; flex-direction: column; gap: 0.2rem; }
.msg-header { display: flex; align-items: baseline; gap: 0.5rem; }
.msg-header strong { font-size: 0.82rem; color: #4f46e5; font-weight: 600; }
.msg-header time { font-size: 0.7rem; color: #bbb; }
.msg-body { background: #f4f4f8; padding: 0.6rem 0.9rem; border-radius: 0 12px 12px 12px; font-size: 0.95rem; line-height: 1.5; color: #1a1a2e; word-break: break-word; }
.notificacao { text-align: center; font-size: 0.78rem; color: #aaa; padding: 0.2rem 0; }
#typing-indicator { padding: 0.3rem 1.5rem 0.4rem; font-size: 0.8rem; color: #999; font-style: italic; min-height: 1.5rem; }
#message-form { display: flex; gap: 0.5rem; padding: 1rem; border-top: 1.5px solid #f0f0f0; }
#message-input { flex: 1; padding: 0.75rem 1rem; border: 1.5px solid #e0e0e0; border-radius: 10px; font-size: 1rem; outline: none; }
#message-input:focus { border-color: #4f46e5; }
#message-form button { padding: 0.75rem 1.3rem; background: #4f46e5; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; }
#message-form button:hover { background: #4338ca; }
EOF

# Instala dependências
echo ""
echo "📦 Instalando dependências..."
npm install

echo ""
echo "✅ Pronto! Rode: npm run dev"