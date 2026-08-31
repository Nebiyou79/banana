const Follow = require('../../../src/models/Follow');
const { createUser } = require('../../helpers/auth');

describe('Follow model', () => {
  it('rejects duplicate follow relationships', async () => {
    const follower = await createUser();
    const target = await createUser();

    await Follow.create({
      follower: follower._id,
      targetType: 'User',
      targetId: target._id,
    });

    await expect(
      Follow.create({
        follower: follower._id,
        targetType: 'User',
        targetId: target._id,
      })
    ).rejects.toThrow();
  });

  it('saves with valid minimal data', async () => {
    const follower = await createUser();
    const target = await createUser();

    const follow = await Follow.create({
      follower: follower._id,
      targetType: 'User',
      targetId: target._id,
    });

    expect(follow.status).toBe('active');
    expect(follow.followSource).toBe('manual');
  });

  it('block and unblock toggle status', async () => {
    const follower = await createUser();
    const target = await createUser();

    const follow = await Follow.create({
      follower: follower._id,
      targetType: 'User',
      targetId: target._id,
    });

    await follow.block();
    expect(follow.status).toBe('blocked');

    await follow.unblock();
    expect(follow.status).toBe('active');
  });

  it('getConnections returns mutual follows only', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const userC = await createUser();

    await Follow.create({ follower: userA._id, targetType: 'User', targetId: userB._id });
    await Follow.create({ follower: userB._id, targetType: 'User', targetId: userA._id });
    await Follow.create({ follower: userA._id, targetType: 'User', targetId: userC._id });

    const connections = await Follow.getConnections(userA._id);

    expect(connections).toHaveLength(1);
    expect(connections[0]._id.toString()).toBe(userB._id.toString());
  });
});
