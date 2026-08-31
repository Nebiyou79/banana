const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createProfileForUser } = require('../../helpers/factories/profileFactory');
const Profile = require('../../../src/models/Profile');

describe('profileController integration', () => {
  const app = getApp();

  describe('GET /api/v1/profile', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('creates default profile on first access', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/profile')
        .set(authHeader(user._id));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PROFILE_CREATED');
      expect(res.body.data).toBeDefined();
      assertNoPassword(res.body);
    });

    it('returns existing profile for authenticated user', async () => {
      const user = await createUser();
      await createProfileForUser(user);
      const res = await request(app)
        .get('/api/v1/profile')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('PROFILE_RETRIEVED');
      expect(res.body.data).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('PUT /api/v1/profile', () => {
    it('updates basic profile fields', async () => {
      const user = await createUser();
      const res = await request(app)
        .put('/api/v1/profile')
        .set(authHeader(user._id))
        .send({
          headline: 'Updated headline',
          bio: 'Updated bio for profile integration test.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/profile/completion', () => {
    it('returns profile completion status', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/profile/completion')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/profile/summary', () => {
    it('returns profile summary', async () => {
      const user = await createUser();
      await createProfileForUser(user);
      const res = await request(app)
        .get('/api/v1/profile/summary')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/profile/public/:id', () => {
    it('returns public profile by id when profile exists', async () => {
      const user = await createUser();
      await createProfileForUser(user);

      const res = await request(app)
        .get(`/api/v1/profile/public/${user._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/profile/popular', () => {
    it('returns popular profiles', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/profile/popular')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/profile/search', () => {
    it('searches profiles by query', async () => {
      const user = await createUser({ name: 'Searchable Profile User' });
      await createProfileForUser(user, { headline: 'Unique searchable headline' });

      const res = await request(app)
        .get('/api/v1/profile/search')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/profile/professional-info', () => {
    it('updates professional info', async () => {
      const user = await createUser({ role: 'candidate' });
      const res = await request(app)
        .put('/api/v1/profile/professional-info')
        .set(authHeader(user._id))
        .send({
          skills: ['JavaScript', 'Node.js'],
          experience: [{ title: 'Developer', company: 'Test Co', startDate: '2020-01' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/profile/social-links', () => {
    it('updates social links', async () => {
      const user = await createUser();
      const res = await request(app)
        .put('/api/v1/profile/social-links')
        .set(authHeader(user._id))
        .send({ socialLinks: { linkedin: 'https://linkedin.com/in/testuser' } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/profile/privacy-settings', () => {
    it('updates privacy settings', async () => {
      const user = await createUser();
      const res = await request(app)
        .put('/api/v1/profile/privacy-settings')
        .set(authHeader(user._id))
        .send({ privacySettings: { profileVisibility: 'public', showEmail: false } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/profile/notification-preferences', () => {
    it('updates notification preferences', async () => {
      const user = await createUser();
      const res = await request(app)
        .put('/api/v1/profile/notification-preferences')
        .set(authHeader(user._id))
        .send({ notificationPreferences: { emailNotifications: true, pushNotifications: false } });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/profile/verification', () => {
    it('submits verification request with valid documents', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/profile/verification')
        .set(authHeader(user._id))
        .send({
          documents: [
            {
              documentType: 'government_id',
              url: 'https://cdn.test/documents/national-id.pdf',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');

      const profile = await Profile.findOne({ user: user._id });
      expect(profile.verificationStatus).toBe('pending');
      expect(profile.verificationDetails.documents).toHaveLength(1);
    });
  });

  describe('PUT /api/v1/profile/social-stats', () => {
    it('updates social stats for authenticated user profile', async () => {
      const user = await createUser();
      await createProfileForUser(user);
      const res = await request(app)
        .put('/api/v1/profile/social-stats')
        .set(authHeader(user._id))
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('SOCIAL_STATS_UPDATED');
      expect(res.body.data).toMatchObject({
        followerCount: expect.any(Number),
        followingCount: expect.any(Number),
        postCount: expect.any(Number),
        connectionCount: expect.any(Number),
      });
    });
  });
});
