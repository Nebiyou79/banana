const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const { createFreelancerProfile } = require('../../helpers/factories/freelancerFactory');
const User = require('../../../src/models/User');

const CLOUDINARY_URL = 'https://res.cloudinary.com/test-cloud/image/upload/v1/sample.jpg';

describe('freelancerController integration', () => {
  const app = getApp();

  describe('GET /api/v1/freelancer/profile', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/freelancer/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns freelancer profile', async () => {
      const freelancer = await createUser({ role: 'freelancer' });
      const res = await request(app)
        .get('/api/v1/freelancer/profile')
        .set(authHeader(freelancer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('PUT /api/v1/freelancer/profile', () => {
    it('updates freelancer profile fields', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .put('/api/v1/freelancer/profile')
        .set(authHeader(user._id))
        .send({
          headline: 'Updated headline',
          bio: 'Updated bio for integration testing purposes.',
          hourlyRate: 75,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.freelancerProfile.headline).toBe('Updated headline');
    });
  });

  describe('GET /api/v1/freelancer/dashboard/overview', () => {
    it('returns dashboard overview for freelancer', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/dashboard/overview')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/stats', () => {
    it('returns freelancer stats', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/stats')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/portfolio', () => {
    it('returns portfolio items', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/portfolio')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('POST /api/v1/freelancer/portfolio', () => {
    it('adds a portfolio item', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .post('/api/v1/freelancer/portfolio')
        .set(authHeader(user._id))
        .send({
          title: 'Test Project',
          description: 'Portfolio project created during integration testing.',
          category: 'web-development',
          mediaUrls: [CLOUDINARY_URL],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Project');
    });
  });

  describe('GET /api/v1/freelancer/portfolio/:id', () => {
    it('returns 404 for unknown portfolio item', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/portfolio/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/freelancer/services', () => {
    it('returns services list', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/services')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/freelancer/services', () => {
    it('adds a service', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .post('/api/v1/freelancer/services')
        .set(authHeader(user._id))
        .send({
          title: 'Web Development',
          description: 'Full stack web development service.',
          price: 100,
          deliveryTime: 7,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/certifications', () => {
    it('returns certifications', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/certifications')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/freelancer/certifications', () => {
    it('adds a certification', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .post('/api/v1/freelancer/certifications')
        .set(authHeader(user._id))
        .send({
          name: 'AWS Certified',
          issuer: 'Amazon',
          issueDate: '2024-01-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/stats/uploads', () => {
    it('returns upload stats', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/stats/uploads')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.code).toBe('UPLOAD_STATS_RETRIEVED');
      expect(res.body.data.freelancerStats).toBeDefined();
    });
  });

  describe('GET /api/v1/freelancer/tenders', () => {
    it('returns tenders list', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/tenders')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/tenders/saved/all', () => {
    it('returns saved tenders', async () => {
      const { user } = await createFreelancerProfile();
      const res = await request(app)
        .get('/api/v1/freelancer/tenders/saved/all')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/freelancer/public/:usernameOrId', () => {
    it('returns public profile for freelancer', async () => {
      const { user } = await createFreelancerProfile();
      const viewer = await createUser({ role: 'company' });
      const res = await request(app)
        .get(`/api/v1/freelancer/public/${user._id}`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('portfolio item lifecycle', () => {
    it('updates and deletes a portfolio item', async () => {
      const { user } = await createFreelancerProfile();
      const createRes = await request(app)
        .post('/api/v1/freelancer/portfolio')
        .set(authHeader(user._id))
        .send({
          title: 'Lifecycle Project',
          description: 'Project used to test update and delete flows.',
          category: 'web-development',
          mediaUrls: [CLOUDINARY_URL],
        });

      const itemId = createRes.body.data._id;

      const updateRes = await request(app)
        .put(`/api/v1/freelancer/portfolio/${itemId}`)
        .set(authHeader(user._id))
        .send({ title: 'Updated Lifecycle Project' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Updated Lifecycle Project');

      const deleteRes = await request(app)
        .delete(`/api/v1/freelancer/portfolio/${itemId}`)
        .set(authHeader(user._id));

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      const profile = await User.findById(user._id);
      expect(profile.portfolio.some((p) => p._id.toString() === itemId)).toBe(false);
    });
  });
});
