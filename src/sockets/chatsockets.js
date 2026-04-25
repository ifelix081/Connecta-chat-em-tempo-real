const message = require('../models/message');

const roomusers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) =>     {
        console.log('Usuário conectado: ${socket.id}');
        socket.on('disconnect', () => {
            console.log('Usuário desconectando: ${socket.id}');
        });
    });
};

socket.on('join_room', async ({username, room}) => {
    Array.from(socket.rooms)
        .filter(r => r !== socket.id)
        .forEach(r => socket.leave(r));

    socket.join(room);
    socket.data = {username, room};
//registra usuario
    if (!roomusers.has(room)) roomusers.set(room, new Map());
    roomusers.get(room).set(socket.id, username);
//envia historico pra quem entoru
    const history = await message.find({room})
    .sort({createdAt: -1}).limit(50);
    socket.emit('message_history', history.reverse());
//avisa quem entrou
    socket.to(room).emit('user_joined', {username, users: getUserList(room)});
//envia lista de quem ta
    socket.emit('room_users', getUserList(room));
});

socket.on('send_message', async ({ text }) => {
    const { username, room } = socket.data;
    if (!username || !room || !text.trim()) return;

    const message = new Message({ room, username, text: text.trim() });
    await message.save();

  // transmite para TODOS na sala (inclusive quem enviou)
    io.to(room).emit('new_message', {
    _id: message._id,
    username,
    text: message.text,
    createdAt: message.createdAt
    });
});

socket.on('typing', (isTyping) => {
    const { username, room } = socket.data;
    if (!room) return;
    socket.to(room).emit('user_typing', { username, isTyping });
});

socket.on('disconnect', () => {
    const { username, room } = socket.data || {};
    if (!room) return;

    roomUsers.get(room)?.delete(socket.id);

    io.to(room).emit('user_left', {
    username,
    users: getUserList(room)
    });
});

function getUserList(room) {
    return Array.from(roomUsers.get(room)?.values() || []);
}