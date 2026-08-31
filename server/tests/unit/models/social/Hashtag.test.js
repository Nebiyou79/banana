const mongoose = require('mongoose');
const Hashtag = require('../../../../src/models/social/Hashtag');

describe('Hashtag model (social)', () => {
  it('rejects invalid characters in name', async () => {
    await expect(
      Hashtag.create({ name: 'Bad Tag!' })
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data and lowercases name', async () => {
    const hashtag = await Hashtag.create({ name: 'BananaDev' });

    expect(hashtag.name).toBe('bananadev');
    expect(hashtag.postCount).toBe(0);
  });

  it('rejects duplicate hashtag names', async () => {
    await Hashtag.create({ name: 'unique_tag' });

    await expect(Hashtag.create({ name: 'unique_tag' })).rejects.toThrow();
  });

  it('calculateTrendingScore weighs recency and usage', () => {
    const hashtag = new Hashtag({
      name: 'trending_now',
      postCount: 10,
      usageCount: 5,
      lastUsed: new Date(),
    });

    const score = hashtag.calculateTrendingScore();

    expect(score).toBeGreaterThan(0);
    expect(typeof score).toBe('number');
  });
});
