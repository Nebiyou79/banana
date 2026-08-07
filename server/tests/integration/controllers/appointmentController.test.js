const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('appointmentController integration', () => {
  const app = getApp();

  describe('GET /api/v1/appointments/slots', () => {
    it('returns 400 without date query param', async () => {
      const res = await request(app).get('/api/v1/appointments/slots');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/date/i);
    });

    it('returns available slots for valid date', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/slots')
        .query({ date: '2026-12-01' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.slots)).toBe(true);
    });
  });

  describe('POST /api/v1/appointments', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/appointments')
        .send({ date: '2026-12-01', timeSlot: '10:00' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when required fields missing', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/appointments')
        .set(authHeader(user._id))
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/appointments/user/:userId', () => {
    it('returns appointments for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get(`/api/v1/appointments/user/${user._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.appointments)).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
