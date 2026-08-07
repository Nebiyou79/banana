const mongoose = require('mongoose');
const Interaction = require('../../../src/models/Like');
const Post = require('../../../src/models/Post');
const { createUser } = require('../../helpers/auth');

describe('Like model (Interaction)', () => {
  it('requires reaction when interactionType is reaction', async () => {
    const user = await createUser();
    const post = await Post.create({ author: user._id, content: 'React to me' });

    await expect(
      Interaction.create({
        user: user._id,
        targetType: 'Post',
        targetId: post._id,
        interactionType: 'reaction',
      })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves reaction with valid minimal data', async () => {
    const user = await createUser();
    const post = await Post.create({ author: user._id, content: 'Like this' });

    const interaction = await Interaction.create({
      user: user._id,
      targetType: 'Post',
      targetId: post._id,
      interactionType: 'reaction',
      reaction: 'like',
    });

    expect(interaction.reaction).toBe('like');
    expect(interaction.emoji).toBe('👍');
  });

  it('rejects duplicate user-target interactions', async () => {
    const user = await createUser();
    const post = await Post.create({ author: user._id, content: 'Unique like' });

    await Interaction.create({
      user: user._id,
      targetType: 'Post',
      targetId: post._id,
      interactionType: 'reaction',
      reaction: 'heart',
    });

    await expect(
      Interaction.create({
        user: user._id,
        targetType: 'Post',
        targetId: post._id,
        interactionType: 'reaction',
        reaction: 'clap',
      })
    ).rejects.toThrow();
  });

  it('getReactionStats aggregates counts by reaction type', async () => {
    const author = await createUser();
    const likerA = await createUser();
    const likerB = await createUser();
    const post = await Post.create({ author: author._id, content: 'Stats post' });

    await Interaction.create({
      user: likerA._id,
      targetType: 'Post',
      targetId: post._id,
      interactionType: 'reaction',
      reaction: 'like',
    });
    await Interaction.create({
      user: likerB._id,
      targetType: 'Post',
      targetId: post._id,
      interactionType: 'reaction',
      reaction: 'heart',
    });

    const stats = await Interaction.getReactionStats('Post', post._id);

    expect(stats.total).toBe(2);
    expect(stats.hasReactions).toBe(true);
    expect(stats.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reaction: 'like', count: 1 }),
        expect.objectContaining({ reaction: 'heart', count: 1 }),
      ])
    );
  });
});
