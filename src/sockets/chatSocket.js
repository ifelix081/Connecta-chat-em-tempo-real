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
