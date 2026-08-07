const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Post = require('../../../src/models/Post');

describe('likeController integration', () => {
  const app = getApp();

  describe('POST /api/v1/likes/:id/react', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/likes/507f1f77bcf86cd799439011/react')
        .send({ targetType: 'Post' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when post not found', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/likes/507f1f77bcf86cd799439011/react')
        .set(authHeader(user._id))
        .send({ targetType: 'Post', reaction: 'like' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('adds reaction to existing post', async () => {
      const author = await createUser();
      const liker = await createUser();
      const post = await Post.create({
        author: author._id,
        content: 'Post to like',
        status: 'active',
      });

      const res = await request(app)
        .post(`/api/v1/likes/${post._id}/react`)
        .set(authHeader(liker._id))
        .send({ targetType: 'Post', reaction: 'like' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });
});
