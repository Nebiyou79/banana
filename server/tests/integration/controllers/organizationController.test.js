const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createAdmin } = require('../../helpers/factories/userFactory');
const Organization = require('../../../src/models/Organization');
const User = require('../../../src/models/User');

async function createOrganizationViaApi(name = 'Test Organization') {
  const user = await createUser({ role: 'organization' });
  const res = await request(getApp())
    .post('/api/v1/organization')
    .set(authHeader(user._id))
    .send({
      name,
      organizationType: 'non-profit',
      industry: 'education',
    });

  return { user, organization: res.body.data, response: res };
}

describe('organizationController integration', () => {
  const app = getApp();

  describe('GET /api/v1/organization/public/:id', () => {
    it('returns 404 for unknown organization', async () => {
      const res = await request(app).get('/api/v1/organization/public/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns public organization profile', async () => {
      const { organization } = await createOrganizationViaApi('Public Org');

      const res = await request(app).get(`/api/v1/organization/public/${organization._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Public Org');
      expect(res.body.data.registrationNumber).toBeUndefined();
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/organization', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/organization');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns success with null data when organization profile not found', async () => {
      const user = await createUser({ role: 'organization' });
      const res = await request(app)
        .get('/api/v1/organization')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });

    it('returns organization profile for authenticated owner', async () => {
      const { user, organization } = await createOrganizationViaApi('My Organization');

      const res = await request(app)
        .get('/api/v1/organization')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('My Organization');
      expect(res.body.data._id.toString()).toBe(organization._id.toString());
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/organization/:id', () => {
    it('requires authentication', async () => {
      const { organization } = await createOrganizationViaApi();
      const res = await request(app).get(`/api/v1/organization/${organization._id}`);
      expect(res.status).toBe(401);
    });

    it('returns 404 for unknown organization', async () => {
      const { user } = await createOrganizationViaApi();
      const res = await request(app)
        .get('/api/v1/organization/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Organization not found');
    });

    it('returns organization by id', async () => {
      const { user, organization } = await createOrganizationViaApi('Org By ID');

      const res = await request(app)
        .get(`/api/v1/organization/${organization._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Org By ID');
    });
  });

  describe('POST /api/v1/organization', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/organization')
        .send({ name: 'Unauthorized Org' });

      expect(res.status).toBe(401);
    });

    it('requires organization role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .post('/api/v1/organization')
        .set(authHeader(candidate._id))
        .send({ name: 'Wrong Role Org' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('creates organization profile and updates user in database', async () => {
      const user = await createUser({ role: 'organization' });
      const res = await request(app)
        .post('/api/v1/organization')
        .set(authHeader(user._id))
        .send({
          name: 'New Integration Organization',
          organizationType: 'non-profit',
          industry: 'education',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Integration Organization');

      const saved = await Organization.findOne({ user: user._id });
      expect(saved).not.toBeNull();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.hasOrganizationProfile).toBe(true);
      expect(updatedUser.organization.toString()).toBe(saved._id.toString());
    });
  });

  describe('PUT /api/v1/organization/me', () => {
    it('returns 404 when organization profile not found', async () => {
      const user = await createUser({ role: 'organization' });
      const res = await request(app)
        .put('/api/v1/organization/me')
        .set(authHeader(user._id))
        .send({ mission: 'No profile yet' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Organization profile not found');
    });

    it('updates organization profile in database', async () => {
      const { user, organization } = await createOrganizationViaApi();

      const res = await request(app)
        .put('/api/v1/organization/me')
        .set(authHeader(user._id))
        .send({ mission: 'Updated mission statement' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mission).toBe('Updated mission statement');

      const updated = await Organization.findById(organization._id);
      expect(updated.mission).toBe('Updated mission statement');
    });
  });

  describe('PUT /api/v1/organization/:id', () => {
    it('returns 403 when non-owner non-admin tries to update', async () => {
      const { organization } = await createOrganizationViaApi();
      const other = await createUser({ role: 'organization' });

      const res = await request(app)
        .put(`/api/v1/organization/${organization._id}`)
        .set(authHeader(other._id))
        .send({ description: 'Unauthorized update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized to update this organization');
    });

    it('allows admin to update any organization', async () => {
      const { organization } = await createOrganizationViaApi();
      const admin = await createAdmin();

      const res = await request(app)
        .put(`/api/v1/organization/${organization._id}`)
        .set(authHeader(admin._id))
        .send({ description: 'Admin updated org description' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Admin updated org description');
    });
  });
});
