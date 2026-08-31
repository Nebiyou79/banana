const mongoose = require('mongoose');
const Post = require('../../../src/models/Post');
const { createUser } = require('../../helpers/auth');

describe('Post model', () => {
  it('requires content when no media is attached', async () => {
    const author = await createUser();

    await expect(
      Post.create({ author: author._id, content: '' })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves text post with valid minimal data', async () => {
    const author = await createUser();

    const post = await Post.create({
      author: author._id,
      content: 'Hello #banana world',
    });

    expect(post.type).toBe('text');
    expect(post.status).toBe('active');
  });

  it('pre-save extracts hashtags from content', async () => {
    const author = await createUser();

    const post = await Post.create({
      author: author._id,
      content: 'Learning #javascript and #nodejs today',
    });

    expect(post.hashtags).toEqual(
      expect.arrayContaining(['javascript', 'nodejs'])
    );
  });

  it('incrementStats updates engagement counters', async () => {
    const author = await createUser();
    const post = await Post.create({ author: author._id, content: 'Stats test' });

    await post.incrementStats('likes', 3);

    expect(post.stats.likes).toBe(3);
  });
});
