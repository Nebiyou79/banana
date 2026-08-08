const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createCandidate, createAdmin } = require('../../helpers/factories/userFactory');
const Company = require('../../../src/models/Company');
const User = require('../../../src/models/User');

describe('companyController integration', () => {
  const app = getApp();

  describe('GET /api/v1/company/public/:id', () => {
    it('returns 404 for unknown company', async () => {
      const res = await request(app).get('/api/v1/company/public/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns public company profile', async () => {
      const { company } = await createCompanyWithUser({ name: 'Test Company Ltd' });

      const res = await request(app).get(`/api/v1/company/public/${company._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Company Ltd');
      expect(res.body.data.tin).toBeUndefined();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/company', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/company');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns success with null data when company profile not found', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/company')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('returns company profile for authenticated owner', async () => {
      const { user, company } = await createCompanyWithUser({ name: 'My Company Profile' });

      const res = await request(app)
        .get('/api/v1/company')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('My Company Profile');
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/company/:id', () => {
    it('requires authentication', async () => {
      const { company } = await createCompanyWithUser();
      const res = await request(app).get(`/api/v1/company/${company._id}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 for unknown company', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .get('/api/v1/company/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Company not found');
    });

    it('returns company by id', async () => {
      const { user, company } = await createCompanyWithUser({ name: 'Company By ID' });

      const res = await request(app)
        .get(`/api/v1/company/${company._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Company By ID');
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/company', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/company')
        .send({ name: 'Unauthorized Company' });

      expect(res.status).toBe(401);
    });

    it('requires company role', async () => {
      const candidate = await createCandidate();
      const res = await request(app)
        .post('/api/v1/company')
        .set(authHeader(candidate._id))
        .send({ name: 'Wrong Role Company', industry: 'technology' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid TIN validation', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .post('/api/v1/company')
        .set(authHeader(user._id))
        .send({ name: 'Invalid TIN Co', industry: 'technology', tin: '123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toContain('TIN number must be exactly 10 digits');
    });

    it('creates company profile and updates user in database', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .post('/api/v1/company')
        .set(authHeader(user._id))
        .send({
          name: 'New Integration Company',
          industry: 'technology',
          tin: '1234567890',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Integration Company');

      const saved = await Company.findOne({ user: user._id });
      expect(saved).not.toBeNull();
      expect(saved.name).toBe('New Integration Company');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.hasCompanyProfile).toBe(true);
      expect(updatedUser.company.toString()).toBe(saved._id.toString());
    });

    it('returns 400 when company profile already exists', async () => {
      const { user } = await createCompanyWithUser();
      const res = await request(app)
        .post('/api/v1/company')
        .set(authHeader(user._id))
        .send({ name: 'Duplicate Company', industry: 'technology' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Company profile already exists for this user');
    });
  });

  describe('PUT /api/v1/company/me', () => {
    it('returns 404 when company profile not found', async () => {
      const user = await createUser({ role: 'company' });
      const res = await request(app)
        .put('/api/v1/company/me')
        .set(authHeader(user._id))
        .send({ description: 'No profile yet' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Company profile not found');
    });

    it('updates company profile in database', async () => {
      const { user, company } = await createCompanyWithUser();

      const res = await request(app)
        .put('/api/v1/company/me')
        .set(authHeader(user._id))
        .send({ description: 'Updated company description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated company description');

      const updated = await Company.findById(company._id);
      expect(updated.description).toBe('Updated company description');
    });

    it('returns 400 for invalid phone validation', async () => {
      const { user } = await createCompanyWithUser();

      const res = await request(app)
        .put('/api/v1/company/me')
        .set(authHeader(user._id))
        .send({ phone: 'not-a-phone' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('PUT /api/v1/company/:id', () => {
    it('returns 403 when non-owner non-admin tries to update', async () => {
      const { company } = await createCompanyWithUser();
      const other = await createUser({ role: 'company' });

      const res = await request(app)
        .put(`/api/v1/company/${company._id}`)
        .set(authHeader(other._id))
        .send({ description: 'Unauthorized update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized to update this company');
    });

    it('allows admin to update any company', async () => {
      const { company } = await createCompanyWithUser();
      const admin = await createAdmin();

      const res = await request(app)
        .put(`/api/v1/company/${company._id}`)
        .set(authHeader(admin._id))
        .send({ description: 'Admin updated description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Admin updated description');
    });
  });
});
