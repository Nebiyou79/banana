const Save = require('../../../src/models/Save');
const Post = require('../../../src/models/Post');
const { createUser } = require('../../helpers/auth');

describe('Save model', () => {
  it('saves with valid minimal data and default targetType', async () => {
    const user = await createUser();
    const post = await Post.create({ author: user._id, content: 'Saved post' });

    const saved = await Save.create({
      user: user._id,
      targetId: post._id,
    });

    expect(saved.targetType).toBe('Post');
  });

  it('rejects duplicate save for same user and target', async () => {
    const user = await createUser();
    const post = await Post.create({ author: user._id, content: 'Unique save' });

    await Save.create({ user: user._id, targetId: post._id, targetType: 'Post' });

    await expect(
      Save.create({ user: user._id, targetId: post._id, targetType: 'Post' })
    ).rejects.toThrow();
  });

  it('allows same user to save different target types for same id shape', async () => {
    const user = await createUser();
    const targetId = postId();

    await Save.create({ user: user._id, targetId, targetType: 'Post' });
    const jobSave = await Save.create({ user: user._id, targetId, targetType: 'Job' });

    expect(jobSave.targetType).toBe('Job');
  });
});

function postId() {
  const mongoose = require('mongoose');
  return new mongoose.Types.ObjectId();
}
