const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCandidate, createAdmin } = require('../../helpers/factories/userFactory');
const User = require('../../../src/models/User');

describe('verificationController integration', () => {
  const app = getApp();

  describe('GET /api/v1/verification/status/:userId', () => {
    it('returns verification status publicly', async () => {
      const user = await createCandidate();
      const res = await request(app).get(`/api/v1/verification/status/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verificationStatus).toBeDefined();
      assertNoPassword(res.body);
    });

    it('returns 404 for unknown user', async () => {
      const res = await request(app).get('/api/v1/verification/status/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('GET /api/v1/verification/my-status', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/verification/my-status');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns own verification status when authenticated', async () => {
      const user = await createCandidate();
      const res = await request(app)
        .get('/api/v1/verification/my-status')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('PATCH /api/v1/verification/update/:userId', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .patch('/api/v1/verification/update/507f1f77bcf86cd799439011')
        .send({ profileVerified: true });

      expect(res.status).toBe(401);
    });

    it('requires admin role', async () => {
      const candidate = await createCandidate();
      const target = await createCandidate();
      const res = await request(app)
        .patch(`/api/v1/verification/update/${target._id}`)
        .set(authHeader(candidate._id))
        .send({ profileVerified: true });

      expect(res.status).toBe(403);
    });

    it('updates verification status as admin', async () => {
      const admin = await createAdmin();
      const target = await createCandidate();
      const res = await request(app)
        .patch(`/api/v1/verification/update/${target._id}`)
        .set(authHeader(admin._id))
        .send({
          profileVerified: true,
          socialVerified: true,
          documentsVerified: true,
          verificationStatus: 'full',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verificationStatus).toBe('full');
      assertNoPassword(res.body);

      const updated = await User.findById(target._id);
      expect(updated.verificationDetails.profileVerified).toBe(true);
    });

    it('returns 404 for unknown user', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .patch('/api/v1/verification/update/507f1f77bcf86cd799439011')
        .set(authHeader(admin._id))
        .send({ profileVerified: true });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('POST /api/v1/verification/request', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/verification/request')
        .send({ verificationType: 'profile' });

      expect(res.status).toBe(401);
    });

    it('submits verification request and persists to database', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .post('/api/v1/verification/request')
        .set(authHeader(candidate._id))
        .send({
          verificationType: 'profile',
          description: 'Please verify my profile',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.request.status).toBe('pending');
    });
  });

  describe('GET /api/v1/verification/requests', () => {
    it('requires admin role', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .get('/api/v1/verification/requests')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
    });

    it('returns pending verification requests for admin', async () => {
      const admin = await createAdmin();
      const candidate = await createCandidate();
      await request(app)
        .post('/api/v1/verification/request')
        .set(authHeader(candidate._id))
        .send({ verificationType: 'profile', description: 'Admin list test' });

      const res = await request(app)
        .get('/api/v1/verification/requests')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.requests)).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/verification/bulk-update', () => {
    it('returns 400 when userIds missing', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .post('/api/v1/verification/bulk-update')
        .set(authHeader(admin._id))
        .send({ updates: { profileVerified: true } });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User IDs are required');
    });

    it('bulk updates verification for admin', async () => {
      const admin = await createAdmin();
      const target = await createCandidate();
      const res = await request(app)
        .post('/api/v1/verification/bulk-update')
        .set(authHeader(admin._id))
        .send({
          userIds: [target._id.toString()],
          updates: {
            profileVerified: true,
            socialVerified: false,
            documentsVerified: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.modifiedCount).toBeGreaterThanOrEqual(1);

      const updated = await User.findById(target._id);
      expect(updated.verificationDetails.profileVerified).toBe(true);
    });
  });

  describe('GET /api/v1/verification/stats', () => {
    it('requires admin role', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .get('/api/v1/verification/stats')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
    });

    it('returns verification statistics for admin', async () => {
      const admin = await createAdmin();
      const res = await request(app)
        .get('/api/v1/verification/stats')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.total).toBeGreaterThanOrEqual(1);
      assertNoPassword(res.body);
    });
  });
});
