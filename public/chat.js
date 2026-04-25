const socket = io();
let typingTimer;

// --- Entrada na sala ---
document.getElementById('join-btn').addEventListener('click', () => {
    const username = document.getElementById('username-input').value.trim();
    const room     = document.getElementById('room-input').value.trim();
    if (!username || !room) return alert('Preencha nome e sala');

    socket.emit('join_room', { username, room });
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
});

// --- Envio de mensagem ---
document.getElementById('message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    if (!input.value.trim()) return;
    socket.emit('send_message', { text: input.value });
    input.value = '';
});

// --- Indicador "digitando..." com debounce ---
document.getElementById('message-input').addEventListener('input', () => {
    socket.emit('typing', true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => socket.emit('typing', false), 1500);
});

// --- Receber histórico ---
socket.on('message_history', (messages) => {
    messages.forEach(addMessage);
});

// --- Receber nova mensagem ---
socket.on('new_message', addMessage);

// --- Atualizar lista de usuários ---
socket.on('room_users',  updateUsers);
socket.on('user_joined', ({ users }) => updateUsers(users));
socket.on('user_left',   ({ users }) => updateUsers(users));

// --- Indicador de digitação ---
socket.on('user_typing', ({ username, isTyping }) => {
    const el = document.getElementById('typing-indicator');
    el.textContent = isTyping ? `${username} está digitando...` : '';
});

// --- Reconexão automática ---
socket.on('disconnect', () => console.warn('Desconectado. Reconectando...'));

function addMessage({ username, text, createdAt }) {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<strong>${username}</strong> <span>${text}</span>
    <time>${new Date(createdAt).toLocaleTimeString('pt-BR')}</time>`;
    document.getElementById('messages').appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

function updateUsers(users) {
    const ul = document.getElementById('users-list');
    ul.innerHTML = users.map(u => `<li>${u}</li>`).join('');
}