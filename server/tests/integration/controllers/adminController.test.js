const adminController = require('../../../src/controllers/adminController');
const { mockReq, mockRes } = require('../../helpers/mockHttp');
const { createUser, assertNoPassword } = require('../../helpers/auth');
const { createActiveJob } = require('../../helpers/factories/jobFactory');

describe('adminController integration', () => {
  describe('getDashboardStats', () => {
    it('returns dashboard statistics', async () => {
      await createUser({ role: 'candidate' });
      await createUser({ role: 'company' });
      await createActiveJob({ title: 'Admin Stats Job' });

      const req = mockReq({ user: { userId: (await createUser({ role: 'admin' }))._id } });
      const res = mockRes();

      await adminController.getDashboardStats(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.users.total).toBeGreaterThanOrEqual(3);
      expect(res.body.jobs.total).toBeGreaterThanOrEqual(1);
      assertNoPassword(res.body);
    });
  });

  describe('getAllUsers', () => {
    it('returns paginated users without password fields', async () => {
      await createUser({ email: 'admin-list-a@test.com' });
      await createUser({ email: 'admin-list-b@test.com' });

      const req = mockReq({ query: { page: '1', limit: '10' } });
      const res = mockRes();

      await adminController.getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });
  });

  describe('getUserById', () => {
    it('returns 404 for unknown user', async () => {
      const req = mockReq({ params: { id: '507f1f77bcf86cd799439011' } });
      const res = mockRes();

      await adminController.getUserById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('returns user by id', async () => {
      const user = await createUser();
      const req = mockReq({ params: { id: user._id.toString() } });
      const res = mockRes();

      await adminController.getUserById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body._id.toString()).toBe(user._id.toString());
      assertNoPassword(res.body);
    });
  });
});
