const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

let io, serverSocket, clientA, clientB;

beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
        const port = httpServer.address().port;
        clientA = Client(`http://localhost:${port}`);
        clientB = Client(`http://localhost:${port}`);
        io.on('connection', (socket) => { serverSocket = socket; });
        clientA.on('connect', done);
    });
});

afterAll(() => {
    io.close();
    clientA.close();
    clientB.close();
});

test('mensagem enviada por A chega em B', (done) => {
    clientA.emit('join_room', { username: 'Alice', room: 'test' });
    clientB.emit('join_room', { username: 'Bob',   room: 'test' });

    clientB.on('new_message', (msg) => {
        expect(msg.text).toBe('Olá Bob!');
        expect(msg.username).toBe('Alice');
        done();
    });

    setTimeout(() => {
        clientA.emit('send_message', { text: 'Olá Bob!' });
    }, 100);
});

test('evento typing chega para outros usuários', (done) => {
    clientB.on('user_typing', ({ username, isTyping }) => {
        expect(username).toBe('Alice');
        expect(isTyping).toBe(true);
        done();
    });

    clientA.emit('typing', true);
});