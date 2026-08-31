const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const User = require('../../../src/models/User');

describe('authRoutes integration', () => {
  const app = getApp();

  describe('POST /api/v1/auth/register', () => {
    it('returns 400 when passwords do not match', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Route User',
          email: 'route-mismatch@test.com',
          password: 'password123',
          confirmPassword: 'different123',
          role: 'candidate',
        });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Passwords do not match',
      });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 200 with token on successful login', async () => {
      const user = await createUser({
        email: 'route-login@test.com',
        passwordHash: 'password123',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.email).toBe(user.email);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns current user when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user._id.toString()).toBe(user._id.toString());

      const dbUser = await User.findById(user._id);
      expect(dbUser).toBeTruthy();
      assertNoPassword(res.body);
    });
  });
});
