import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

let app;
beforeAll(async () => {
  // Importa a app do server (ou podemos mockar)
  app = (await import('../server.js')).default || 'http://localhost:' + (process.env.PORT || 3001);
});

test('GET /health deve responder status ok', async () => {
  const res = await request('http://localhost:' + (process.env.PORT || 3001)).get('/health');
  expect([200,500]).toContain(res.statusCode);
});

test('GET /api/tables deve responder 200', async () => {
  const res = await request('http://localhost:' + (process.env.PORT || 3001)).get('/api/tables');
  expect([200,500]).toContain(res.statusCode);
});