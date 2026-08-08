const request = require('supertest');
const { validationResult } = require('express-validator');
const authController = require('../../../src/controllers/authController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { mockReq, mockRes, mockNext } = require('../../helpers/mockHttp');
const User = require('../../../src/models/User');
const OTP = require('../../../src/models/OTP');
const PasswordReset = require('../../../src/models/PasswordReset');

describe('authController integration', () => {
  const app = getApp();

  describe('validateRegistration (direct)', () => {
    it('calls next when validation passes', () => {
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      authController.validateRegistration(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 when required registration fields are missing', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ name: 'Only Name' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

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

    it('returns 400 for invalid role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Bad Role User',
          email: `bad-role-${Date.now()}@test.com`,
          password: 'password123',
          confirmPassword: 'password123',
          role: 'invalid-role',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid role/i);
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

  describe('POST /api/v1/auth/verify-otp', () => {
    it('returns 400 when email or otp missing', async () => {
      const res = await request(app).post('/api/v1/auth/verify-otp').send({ email: 'a@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('returns 400 for invalid otp', async () => {
      const user = await createUser({ email: 'verify-bad@test.com', emailVerified: false });
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: user.email, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid or expired otp/i);
    });

    it('verifies email and returns token on valid otp', async () => {
      const email = `verify-ok-${Date.now()}@test.com`;
      const user = await createUser({ email, emailVerified: false });
      await OTP.create({
        email,
        otp: '123456',
        type: 'register',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.emailVerified).toBe(true);
      assertNoPassword(res.body);

      const updated = await User.findById(user._id);
      expect(updated.emailVerified).toBe(true);
    });
  });

  describe('POST /api/v1/auth/resend-otp', () => {
    it('returns 400 when email missing', async () => {
      const res = await request(app).post('/api/v1/auth/resend-otp').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/email is required/i);
    });

    it('returns 404 when user not found', async () => {
      const res = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({ email: 'missing@test.com' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when email already verified', async () => {
      const user = await createUser({ emailVerified: true });
      const res = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({ email: user.email });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already verified/i);
    });

    it('resends otp for unverified user', async () => {
      const user = await createUser({ emailVerified: false });
      const res = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const otpCount = await OTP.countDocuments({ email: user.email, type: 'register' });
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

  describe('POST /api/v1/auth/logout', () => {
    it('returns success without auth', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, message: 'Logout successful' });
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns 400 when email missing', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/email is required/i);
    });

    it('returns generic success even when email unknown', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'unknown@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('creates reset otp for existing user', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const otpCount = await OTP.countDocuments({ email: user.email, type: 'reset-password' });
      expect(otpCount).toBe(1);
    });
  });

  describe('POST /api/v1/auth/verify-reset-otp', () => {
    it('returns 400 when fields missing', async () => {
      const res = await request(app).post('/api/v1/auth/verify-reset-otp').send({ email: 'a@test.com' });
      expect(res.status).toBe(400);
    });

    it('returns reset token on valid otp', async () => {
      const user = await createUser();
      await OTP.create({
        email: user.email,
        otp: '654321',
        type: 'reset-password',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-reset-otp')
        .send({ email: user.email, otp: '654321' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeTruthy();
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('returns 400 when passwords do not match', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'abc', password: 'one', confirmPassword: 'two' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/do not match/i);
    });

    it('resets password with valid token', async () => {
      const user = await createUser({ passwordHash: 'oldpassword123' });
      const token = PasswordReset.generateToken();
      await PasswordReset.create({
        email: user.email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, password: 'newpassword123', confirmPassword: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'newpassword123' });
      expect(loginRes.status).toBe(200);
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

  describe('generateReferralCode (direct)', () => {
    it('generates referral code for user', async () => {
      const user = await createUser();
      const req = mockReq({ user: { userId: user._id } });
      const res = mockRes();

      await authController.generateReferralCode(req, res);

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBeTruthy();
    });
  });

  describe('getMyReferralStats (direct)', () => {
    it('returns referral stats for user', async () => {
      const user = await createUser();
      const req = mockReq({ user: { userId: user._id } });
      const res = mockRes();

      await authController.getMyReferralStats(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/admin/create', () => {
    it('requires admin authentication', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/auth/admin/create')
        .set(authHeader(user._id))
        .send({ name: 'New Admin', email: 'newadmin@test.com', password: 'adminpass123' });

      expect(res.status).toBe(403);
    });

    it('creates admin when called by existing admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const email = `new-admin-${Date.now()}@test.com`;
      const res = await request(app)
        .post('/api/v1/auth/admin/create')
        .set(authHeader(admin._id))
        .send({ name: 'Created Admin', email, password: 'adminpass123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('admin');
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/auth/admin/users', () => {
    it('returns paginated admin list for admin', async () => {
      const admin = await createUser({ role: 'admin' });
      const res = await request(app)
        .get('/api/v1/auth/admin/users')
        .set(authHeader(admin._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
