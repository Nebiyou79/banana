const mongoose = require('mongoose');
const Comment = require('../../../src/models/Comment');
const Post = require('../../../src/models/Post');
const { createUser } = require('../../helpers/auth');

describe('Comment model', () => {
  it('rejects empty content', async () => {
    const author = await createUser();

    await expect(
      Comment.create({
        author: author._id,
        parentType: 'Post',
        parentId: new mongoose.Types.ObjectId(),
        content: '',
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data on a post', async () => {
    const author = await createUser();
    const post = await Post.create({ author: author._id, content: 'Original post' });

    const comment = await Comment.create({
      author: author._id,
      parentType: 'Post',
      parentId: post._id,
      content: 'Great post!',
    });

    expect(comment.moderation.status).toBe('active');
    expect(comment.engagement.likes).toBe(0);
  });

  it('incrementLikes increases engagement counter', async () => {
    const author = await createUser();
    const post = await Post.create({ author: author._id, content: 'Like target' });

    const comment = await Comment.create({
      author: author._id,
      parentType: 'Post',
      parentId: post._id,
      content: 'Like me',
    });

    await comment.incrementLikes(2);

    expect(comment.engagement.likes).toBe(2);
  });

  it('hide sets moderation status to hidden', async () => {
    const author = await createUser();
    const moderator = await createUser({ role: 'admin' });
    const post = await Post.create({ author: author._id, content: 'Moderated post' });

    const comment = await Comment.create({
      author: author._id,
      parentType: 'Post',
      parentId: post._id,
      content: 'Needs moderation',
    });

    await comment.hide(moderator._id, 'Spam');

    expect(comment.moderation.status).toBe('hidden');
    expect(comment.moderation.moderationNotes).toBe('Spam');
  });
});
