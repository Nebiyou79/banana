const NotificationPreference = require('../../../src/models/NotificationPreference');
const { createUser } = require('../../helpers/auth');

describe('NotificationPreference model', () => {
  it('saves with valid minimal data and category defaults', async () => {
    const user = await createUser();

    const prefs = await NotificationPreference.create({ user: user._id });

    expect(prefs.globalEnabled).toBe(true);
    expect(prefs.categories.jobs.email).toBe(true);
    expect(prefs.categories.social.email).toBe(false);
  });

  it('rejects duplicate user preference documents', async () => {
    const user = await createUser();
    await NotificationPreference.create({ user: user._id });

    await expect(
      NotificationPreference.create({ user: user._id })
    ).rejects.toThrow();
  });

  it('validates quietHours hour bounds', async () => {
    const user = await createUser();

    await expect(
      NotificationPreference.create({
        user: user._id,
        quietHours: { enabled: true, startHour: 25, endHour: 8 },
      })
    ).rejects.toThrow();
  });
});
