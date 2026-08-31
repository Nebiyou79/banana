const request = require('supertest');
const likeController = require('../../../src/controllers/likeController');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader, assertNoPassword } = require('../../helpers/auth');
const Post = require('../../../src/models/Post');
const Comment = require('../../../src/models/Comment');

describe('likeController integration', () => {
  const app = getApp();

  async function createPost(author) {
    return Post.create({
      author: author._id,
      content: 'Post for like integration test',
      status: 'active',
    });
  }

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
      const post = await createPost(author);

      const res = await request(app)
        .post(`/api/v1/likes/${post._id}/react`)
        .set(authHeader(liker._id))
        .send({ targetType: 'Post', reaction: 'like' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);
    });
  });

  describe('POST /api/v1/likes/:id/dislike', () => {
    it('adds dislike to post', async () => {
      const author = await createUser();
      const disliker = await createUser();
      const post = await createPost(author);

      const res = await request(app)
        .post(`/api/v1/likes/${post._id}/dislike`)
        .set(authHeader(disliker._id))
        .send({ targetType: 'Post' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/likes/:id/interact', () => {
    it('removes interaction from post', async () => {
      const author = await createUser();
      const liker = await createUser();
      const post = await createPost(author);

      await request(app)
        .post(`/api/v1/likes/${post._id}/react`)
        .set(authHeader(liker._id))
        .send({ targetType: 'Post', reaction: 'like' });

      const res = await request(app)
        .delete(`/api/v1/likes/${post._id}/interact`)
        .set(authHeader(liker._id))
        .send({ targetType: 'Post' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/likes/:id/react', () => {
    it('updates reaction type', async () => {
      const author = await createUser();
      const liker = await createUser();
      const post = await createPost(author);

      await request(app)
        .post(`/api/v1/likes/${post._id}/react`)
        .set(authHeader(liker._id))
        .send({ targetType: 'Post', reaction: 'like' });

      const res = await request(app)
        .put(`/api/v1/likes/${post._id}/react`)
        .set(authHeader(liker._id))
        .send({ targetType: 'Post', reaction: 'heart' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/likes/:id/toggle', () => {
    it('toggles interaction on post', async () => {
      const author = await createUser();
      const user = await createUser();
      const post = await createPost(author);

      const res = await request(app)
        .post(`/api/v1/likes/${post._id}/toggle`)
        .set(authHeader(user._id))
        .send({ targetType: 'Post', reaction: 'like' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/likes/:id/reactions', () => {
    it('returns reactions for post', async () => {
      const author = await createUser();
      const post = await createPost(author);

      const res = await request(app)
        .get(`/api/v1/likes/${post._id}/reactions`)
        .query({ targetType: 'Post' })
        .set(authHeader(author._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/likes/:id/dislikes', () => {
    it('returns dislikes for post', async () => {
      const author = await createUser();
      const post = await createPost(author);

      const res = await request(app)
        .get(`/api/v1/likes/${post._id}/dislikes`)
        .query({ targetType: 'Post' })
        .set(authHeader(author._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/likes/:id/stats', () => {
    it('returns interaction stats', async () => {
      const author = await createUser();
      const post = await createPost(author);

      const res = await request(app)
        .get(`/api/v1/likes/${post._id}/stats`)
        .query({ targetType: 'Post' })
        .set(authHeader(author._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/likes/:id/user-interaction', () => {
    it('returns user interaction for post', async () => {
      const author = await createUser();
      const user = await createUser();
      const post = await createPost(author);

      const res = await request(app)
        .get(`/api/v1/likes/${post._id}/user-interaction`)
        .query({ targetType: 'Post' })
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/likes/bulk/status', () => {
    it('returns bulk interaction status', async () => {
      const author = await createUser();
      const user = await createUser();
      const post = await createPost(author);

      const res = await request(app)
        .post('/api/v1/likes/bulk/status')
        .set(authHeader(user._id))
        .send({ targetIds: [post._id.toString()], targetType: 'Post' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('legacy post like routes', () => {
    it('supports legacy like endpoints', async () => {
      const author = await createUser();
      const user = await createUser();
      const post = await createPost(author);

      const likeRes = await request(app)
        .post(`/api/v1/likes/posts/${post._id}/like`)
        .set(authHeader(user._id))
        .send({ reaction: 'like' });

      expect(likeRes.status).toBe(201);

      const likesRes = await request(app)
        .get(`/api/v1/likes/posts/${post._id}/likes`)
        .set(authHeader(user._id));
      expect(likesRes.status).toBe(200);

      const unlikeRes = await request(app)
        .delete(`/api/v1/likes/posts/${post._id}/like`)
        .set(authHeader(user._id));

      expect(unlikeRes.status).toBe(200);
    });
  });

  describe('addReaction on comment (direct validation)', () => {
    it('returns 400 for invalid target type', async () => {
      const user = await createUser();
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        body: { targetType: 'Invalid', reaction: 'like' },
        user: { userId: user._id },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; },
      };

      await likeController.addReaction(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('INVALID_TARGET_TYPE');
    });
  });
});
