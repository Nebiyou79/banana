const mongoose = require('mongoose');
const AdminActivityLog = require('../../../src/models/AdminActivityLog');
const { createUser } = require('../../helpers/auth');

describe('AdminActivityLog model', () => {
  it('rejects save when required fields are missing', async () => {
    const log = new AdminActivityLog({ action: 'update' });

    await expect(log.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('saves with valid minimal data', async () => {
    const admin = await createUser({ role: 'admin' });

    const log = await AdminActivityLog.create({
      adminId: admin._id,
      action: 'ban_user',
      targetModel: 'User',
      targetId: new mongoose.Types.ObjectId(),
    });

    expect(log.action).toBe('ban_user');
    expect(log.timestamp).toBeInstanceOf(Date);
  });

  it('stores optional changes as mixed data', async () => {
    const admin = await createUser({ role: 'admin' });

    const log = await AdminActivityLog.create({
      adminId: admin._id,
      action: 'update_settings',
      targetModel: 'SystemSettings',
      targetId: new mongoose.Types.ObjectId(),
      changes: { siteName: 'New Name' },
    });

    expect(log.changes.siteName).toBe('New Name');
  });
});
