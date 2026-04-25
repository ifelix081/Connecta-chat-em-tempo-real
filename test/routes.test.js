const request = require('supertest');
const app = require('../src/app'); // exporte o app separado do server.js

test('GET /health retorna ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
});

test('GET /rooms/:room/messages retorna array', async () => {
    const res = await request(app).get('/rooms/geral/messages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
});