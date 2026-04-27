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