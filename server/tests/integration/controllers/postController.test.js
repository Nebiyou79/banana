const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Post = require('../../../src/models/Post');

describe('postController integration', () => {
  const app = getApp();

  describe('GET /api/v1/posts/feed', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/posts/feed');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns feed for authenticated user', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/posts/feed')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/posts/my-posts', () => {
    it('returns user posts', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/posts/my-posts')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/posts', () => {
    it('creates a post', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/v1/posts')
        .set(authHeader(user._id))
        .send({ content: 'Integration test post content' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Integration test post content');
      assertNoPassword(res.body);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('returns 404 for unknown post', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/posts/507f1f77bcf86cd799439011')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns post by id', async () => {
      const author = await createUser();
      const viewer = await createUser();
      const post = await Post.create({
        author: author._id,
        content: 'Post to fetch by id',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/posts/${post._id}`)
        .set(authHeader(viewer._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Post to fetch by id');
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    it('updates own post', async () => {
      const user = await createUser();
      const post = await Post.create({
        author: user._id,
        content: 'Original content',
        status: 'active',
      });

      const res = await request(app)
        .put(`/api/v1/posts/${post._id}`)
        .set(authHeader(user._id))
        .send({ content: 'Updated post content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Updated post content');
    });
  });

  describe('POST /api/v1/posts/:id/share', () => {
    it('shares a post', async () => {
      const author = await createUser();
      const sharer = await createUser();
      const post = await Post.create({
        author: author._id,
        content: 'Post to share',
        status: 'active',
        allowSharing: true,
      });

      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/share`)
        .set(authHeader(sharer._id))
        .send({ content: 'Sharing this great post!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/posts/:id/save and DELETE /api/v1/posts/:id/save', () => {
    it('saves and unsaves a post', async () => {
      const author = await createUser();
      const saver = await createUser();
      const post = await Post.create({
        author: author._id,
        content: 'Post to save',
        status: 'active',
      });

      const saveRes = await request(app)
        .post(`/api/v1/posts/${post._id}/save`)
        .set(authHeader(saver._id));

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);

      const savedRes = await request(app)
        .get('/api/v1/posts/saved')
        .set(authHeader(saver._id));

      expect(savedRes.status).toBe(200);
      expect(savedRes.body.success).toBe(true);

      const unsaveRes = await request(app)
        .delete(`/api/v1/posts/${post._id}/save`)
        .set(authHeader(saver._id));

      expect(unsaveRes.status).toBe(200);
      expect(unsaveRes.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/posts/profile/:profileId', () => {
    it('returns posts for a profile', async () => {
      const user = await createUser();
      await Post.create({
        author: user._id,
        content: 'Profile post',
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/posts/profile/${user._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('deletes own post', async () => {
      const user = await createUser();
      const post = await Post.create({
        author: user._id,
        content: 'Post to delete',
        status: 'active',
      });

      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Post.findById(post._id);
      expect(deleted.status).toBe('deleted');
    });
  });
});
