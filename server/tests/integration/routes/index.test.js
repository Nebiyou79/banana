const request = require('supertest');
const { getApp } = require('../../helpers/app');

describe('index routes integration', () => {
  const app = getApp();

  it('GET /api/health returns health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status || res.body.success).toBeDefined();
  });

  it('GET /api/test is not registered (returns 404)', async () => {
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(404);
  });

  it('GET /uploads/health returns uploads health', async () => {
    const res = await request(app).get('/uploads/health');
    expect(res.status).toBe(200);
  });

  it('GET unknown route returns 404', async () => {
    const res = await request(app).get('/api/v1/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });
});
