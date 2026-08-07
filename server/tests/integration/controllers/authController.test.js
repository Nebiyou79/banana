const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const User = require('../../../src/models/User');
const OTP = require('../../../src/models/OTP');

describe('authController integration', () => {
  const app = getApp();

  describe('POST /api/v1/auth/register', () => {
    it('returns 400 when passwords do not match', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'mismatch@test.com',
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

    it('returns 409 when email already exists', async () => {
      await createUser({ email: 'duplicate@test.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'duplicate@test.com',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'candidate',
        });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({
        success: false,
        message: 'Email already exists',
      });
    });

    it('creates user in DB and returns 201 on success', async () => {
      const email = `register-${Date.now()}@test.com`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Registered User',
          email,
          password: 'password123',
          confirmPassword: 'password123',
          role: 'candidate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        email,
        requiresVerification: true,
      });
      assertNoPassword(res.body);

      const user = await User.findOne({ email });
      expect(user).toBeTruthy();
      expect(user.emailVerified).toBe(false);

      const otpCount = await OTP.countDocuments({ email, type: 'register' });
      expect(otpCount).toBe(1);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 401 for wrong password', async () => {
      const user = await createUser({
        email: 'login-wrong@test.com',
        passwordHash: 'correctpassword',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
      assertNoPassword(res.body);
    });

    it('returns 200 with token on successful login', async () => {
      const user = await createUser({
        email: 'login-ok@test.com',
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
      assertNoPassword(res.body);
    });
  });
});
