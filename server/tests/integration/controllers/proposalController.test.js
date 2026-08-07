const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');

describe('proposalController integration', () => {
  const app = getApp();

  describe('GET /api/v1/proposals/my-proposals', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/proposals/my-proposals');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns proposals for freelancer', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/proposals/my-proposals')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/proposals/create', () => {
    it('requires freelancer role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/proposals/create')
        .set(authHeader(candidate._id))
        .send({ title: 'Test Proposal' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
