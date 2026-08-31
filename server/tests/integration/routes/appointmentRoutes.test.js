const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createAdmin } = require('../../helpers/factories/userFactory');

describe('appointmentRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/appointments/slots', () => {
    it('returns available slots publicly', async () => {
      const res = await request(app)
        .get('/api/v1/appointments/slots')
        .query({ date: '2026-08-07' });

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
  });

  describe('GET /api/v1/appointments/admin/appointments', () => {
    it('returns 403 for non-admin user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/appointments/admin/appointments')
        .set(authHeader(user._id));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns appointments for admin user', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .get('/api/v1/appointments/admin/appointments')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
