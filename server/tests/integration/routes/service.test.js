const express = require('express');
const request = require('supertest');
const serviceRouter = require('../../../src/routes/service');

describe('service routes integration', () => {
  it('exports an empty express router', () => {
    expect(typeof serviceRouter).toBe('function');
    expect(Array.isArray(serviceRouter.stack)).toBe(true);
    expect(serviceRouter.stack).toHaveLength(0);
  });

  it('returns 404 for unmounted service paths on the app', async () => {
    const app = express();
    app.use('/api/v1/service', serviceRouter);
    app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.originalUrl}`,
      });
    });

    const res = await request(app).get('/api/v1/service/anything');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining('API endpoint not found'),
    });
  });
});
