const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createProfileForUser } = require('../../helpers/factories/profileFactory');
const { runController } = require('../../helpers/runController');
const roleProfileController = require('../../../src/controllers/roleProfileController');
const Profile = require('../../../src/models/Profile');

describe('roleProfileController integration', () => {
  const app = getApp();

  describe('GET /api/v1/role-profile/candidate', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/role-profile/candidate');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when profile does not exist', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .get('/api/v1/role-profile/candidate')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, message: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
    });

    it('returns 403 when user is not a candidate', async () => {
      const companyUser = await createUser({ role: 'company' });
      await createProfileForUser(companyUser);

      const res = await request(app)
        .get('/api/v1/role-profile/candidate')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, code: 'ROLE_MISMATCH' });
    });

    it('returns candidate role profile when profile exists', async () => {
      const candidate = await createUser({ role: 'candidate' });
      await createProfileForUser(candidate, {
        roleSpecific: { skills: ['JavaScript', 'Node.js'] },
      });

      const res = await request(app)
        .get('/api/v1/role-profile/candidate')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skills).toContain('JavaScript');
      assertNoPassword(res.body);
    });
  });

  describe('PUT /api/v1/role-profile/candidate', () => {
    it('returns 403 for company user', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .put('/api/v1/role-profile/candidate')
        .set(authHeader(companyUser._id))
        .send({ skills: ['React'] });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, code: 'ROLE_MISMATCH' });
    });

    it('updates candidate skills and persists to DB', async () => {
      const candidate = await createUser({ role: 'candidate' });

      const res = await request(app)
        .put('/api/v1/role-profile/candidate')
        .set(authHeader(candidate._id))
        .send({ skills: ['TypeScript', 'React'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skills).toEqual(expect.arrayContaining(['TypeScript', 'React']));

      const profile = await Profile.findOne({ user: candidate._id });
      expect(profile.roleSpecific.skills).toContain('TypeScript');
    });
  });

  describe('GET /api/v1/role-profile/company', () => {
    it('returns 404 when company profile not found', async () => {
      const companyUser = await createUser({ role: 'company' });
      const res = await request(app)
        .get('/api/v1/role-profile/company')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, code: 'PROFILE_NOT_FOUND' });
    });

    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      await createProfileForUser(candidate);

      const res = await request(app)
        .get('/api/v1/role-profile/company')
        .set(authHeader(candidate._id));

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, code: 'ROLE_MISMATCH' });
    });

    it('returns company profile data', async () => {
      const companyUser = await createUser({ role: 'company' });
      await createProfileForUser(companyUser, {
        roleSpecific: {
          companyInfo: { mission: 'Build great products', specialties: ['SaaS'] },
        },
      });

      const res = await request(app)
        .get('/api/v1/role-profile/company')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mission).toBe('Build great products');
    });
  });

  describe('PUT /api/v1/role-profile/company', () => {
    it('updates company profile info', async () => {
      const companyUser = await createUser({ role: 'company' });

      const res = await request(app)
        .put('/api/v1/role-profile/company')
        .set(authHeader(companyUser._id))
        .send({
          companyInfo: { mission: 'Innovate daily', culture: 'Remote-first' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const profile = await Profile.findOne({ user: companyUser._id });
      expect(profile.roleSpecific.companyInfo.mission).toBe('Innovate daily');
    });
  });

  describe('GET /api/v1/role-profile/freelancer', () => {
    it('returns 404 when profile not found', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/role-profile/freelancer')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, code: 'PROFILE_NOT_FOUND' });
    });

    it('returns freelancer profile', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      await createProfileForUser(freelancer, {
        roleSpecific: { skills: ['Design', 'Figma'] },
      });

      const res = await request(app)
        .get('/api/v1/role-profile/freelancer')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skills).toContain('Design');
    });
  });

  describe('PUT /api/v1/role-profile/freelancer', () => {
    it('returns 403 for candidate role', async () => {
      const candidate = await createUser({ role: 'candidate' });
      const res = await request(app)
        .put('/api/v1/role-profile/freelancer')
        .set(authHeader(candidate._id))
        .send({ skills: ['Python'] });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, code: 'ROLE_MISMATCH' });
    });

    it('updates freelancer portfolio', async () => {
      const freelancer = await createUser({ role: 'freelancer' });

      const res = await request(app)
        .put('/api/v1/role-profile/freelancer')
        .set(authHeader(freelancer._id))
        .send({
          skills: ['Vue', 'Nuxt'],
          portfolio: [{ title: 'Marketplace App', description: 'Built a freelance marketplace' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const profile = await Profile.findOne({ user: freelancer._id });
      expect(profile.roleSpecific.portfolio[0].title).toBe('Marketplace App');
    });
  });

  describe('GET /api/v1/role-profile/organization', () => {
    it('returns 404 when profile not found', async () => {
      const orgUser = await createUser({ role: 'organization' });
      const res = await request(app)
        .get('/api/v1/role-profile/organization')
        .set(authHeader(orgUser._id));

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, code: 'PROFILE_NOT_FOUND' });
    });

    it('returns 403 for company role', async () => {
      const companyUser = await createUser({ role: 'company' });
      await createProfileForUser(companyUser);

      const res = await request(app)
        .get('/api/v1/role-profile/organization')
        .set(authHeader(companyUser._id));

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({ success: false, code: 'ROLE_MISMATCH' });
    });

    it('returns organization profile', async () => {
      const orgUser = await createUser({ role: 'organization' });
      await createProfileForUser(orgUser, {
        roleSpecific: {
          companyInfo: { mission: 'Serve communities', values: ['Integrity'] },
        },
      });

      const res = await request(app)
        .get('/api/v1/role-profile/organization')
        .set(authHeader(orgUser._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mission).toBe('Serve communities');
    });
  });

  describe('PUT /api/v1/role-profile/organization', () => {
    it('updates organization profile', async () => {
      const orgUser = await createUser({ role: 'organization' });

      const res = await request(app)
        .put('/api/v1/role-profile/organization')
        .set(authHeader(orgUser._id))
        .send({
          companyInfo: { mission: 'Empower NGOs', culture: 'Collaborative' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const profile = await Profile.findOne({ user: orgUser._id });
      expect(profile.roleSpecific.companyInfo.mission).toBe('Empower NGOs');
    });
  });

  describe('roleProfileController direct calls', () => {
    it('getCandidateProfile returns skills via runController', async () => {
      const candidate = await createUser({ role: 'candidate' });
      await createProfileForUser(candidate, {
        roleSpecific: { skills: ['Go', 'Rust'] },
      });

      const { res } = await runController(roleProfileController.getCandidateProfile, {
        req: { user: { userId: candidate._id } },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skills).toContain('Go');
    });
  });
});
