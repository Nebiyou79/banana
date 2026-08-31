const Connection = require('../../../src/models/Connection');
const { createUser } = require('../../helpers/auth');

describe('Connection model', () => {
  it('rejects duplicate follower-following-targetType combinations', async () => {
    const follower = await createUser();
    const following = await createUser();

    await Connection.create({
      follower: follower._id,
      following: following._id,
      targetType: 'User',
      status: 'connected',
    });

    await expect(
      Connection.create({
        follower: follower._id,
        following: following._id,
        targetType: 'User',
      })
    ).rejects.toThrow();
  });

  it('saves with valid minimal data', async () => {
    const follower = await createUser();
    const following = await createUser();

    const connection = await Connection.create({
      follower: follower._id,
      following: following._id,
      targetType: 'User',
    });

    expect(connection.status).toBe('pending');
    expect(connection.connectionStrength).toBe(5);
  });

  it('connectionExists returns connected relationships only', async () => {
    const follower = await createUser();
    const following = await createUser();

    await Connection.create({
      follower: follower._id,
      following: following._id,
      targetType: 'User',
      status: 'pending',
    });

    const pending = await Connection.connectionExists(
      follower._id,
      following._id,
      'User'
    );
    expect(pending).toBeNull();

    await Connection.create({
      follower: following._id,
      following: follower._id,
      targetType: 'User',
      status: 'connected',
    });

    const connected = await Connection.connectionExists(
      following._id,
      follower._id,
      'User'
    );
    expect(connected).not.toBeNull();
  });

  it('toJSON includes connectionDurationDays virtual', () => {
    const connection = new Connection({
      follower: '507f1f77bcf86cd799439011',
      following: '507f1f77bcf86cd799439012',
      targetType: 'User',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    const json = connection.toJSON();
    expect(json.connectionDurationDays).toBeGreaterThanOrEqual(2);
  });
});
