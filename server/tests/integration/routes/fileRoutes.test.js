const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader } = require('../../helpers/auth');

describe('fileRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/uploads/:folder/:filename', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/uploads/cv/test-file.pdf');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/file-info/:folder/:filename', () => {
    it('returns exists false for missing file when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/file-info/cv/nonexistent-file.pdf')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.exists).toBe(false);
    });
  });
});
