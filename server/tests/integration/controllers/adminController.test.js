const mongoose = require('mongoose');
const adminController = require('../../../src/controllers/adminController');
const User = require('../../../src/models/User');
const Report = require('../../../src/models/Report');
const Job = require('../../../src/models/Job');
const SystemSettings = require('../../../src/models/SystemSettings');
const { mockReq, mockRes } = require('../../helpers/mockHttp');
const { createUser, assertNoPassword } = require('../../helpers/auth');
const { createAdmin, createCandidate } = require('../../helpers/factories/userFactory');
const { createActiveJob } = require('../../helpers/factories/jobFactory');
const { createCompanyWithUser } = require('../../helpers/factories/companyFactory');
const { createPublishedTender } = require('../../helpers/factories/tenderFactory');

async function createProfessionalTender(overrides = {}) {
  const { user, company } = overrides.company
    ? { user: overrides.owner, company: overrides.company }
    : await createCompanyWithUser();

  return createPublishedTender({
    tenderCategory: 'professional',
    procurementCategory: 'Construction',
    ownerRole: 'company',
    ownerEntity: company._id,
    ownerEntityModel: 'Company',
    professionalSpecific: {
      referenceNumber: 'REF-001',
      procuringEntity: 'Integration Test Entity',
    },
    owner: user._id,
    company: company._id,
    createdBy: user._id,
    ...overrides,
  });
}

describe('adminController integration', () => {
  describe('getDashboardStats', () => {
    it('returns dashboard statistics', async () => {
      await createCandidate();
      await createUser({ role: 'company' });
      await createActiveJob({ title: 'Admin Stats Job' });

      const admin = await createAdmin();
      const req = mockReq({ user: { _id: admin._id, userId: admin._id } });
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
      await createCandidate({ email: 'admin-list-a@test.com' });
      await createCandidate({ email: 'admin-list-b@test.com' });

      const req = mockReq({ query: { page: '1', limit: '10' } });
      const res = mockRes();

      await adminController.getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      assertNoPassword(res.body);
    });

    it('filters users by role', async () => {
      await createCandidate({ email: 'filter-candidate@test.com' });
      await createUser({ role: 'company', email: 'filter-company@test.com' });

      const req = mockReq({ query: { role: 'candidate', limit: '50' } });
      const res = mockRes();

      await adminController.getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((u) => u.role === 'candidate')).toBe(true);
      assertNoPassword(res.body);
    });

    it('searches users by email', async () => {
      const uniqueEmail = `search-target-${Date.now()}@test.com`;
      await createCandidate({ email: uniqueEmail });

      const req = mockReq({ query: { search: uniqueEmail, limit: '10' } });
      const res = mockRes();

      await adminController.getAllUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.some((u) => u.email === uniqueEmail)).toBe(true);
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
      const user = await createCandidate();
      const req = mockReq({ params: { id: user._id.toString() } });
      const res = mockRes();

      await adminController.getUserById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body._id.toString()).toBe(user._id.toString());
      assertNoPassword(res.body);
    });
  });

  describe('updateUser', () => {
    it('returns 404 for unknown user', async () => {
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: '507f1f77bcf86cd799439011' },
        body: { name: 'Updated Name' },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.updateUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('updates user and persists to database', async () => {
      const admin = await createAdmin();
      const target = await createCandidate({ name: 'Before Update' });
      const req = mockReq({
        params: { id: target._id.toString() },
        body: { name: 'After Update' },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.updateUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('After Update');
      assertNoPassword(res.body);

      const updated = await User.findById(target._id);
      expect(updated.name).toBe('After Update');
    });
  });

  describe('deleteUser', () => {
    it('returns 404 for unknown user', async () => {
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: '507f1f77bcf86cd799439011' },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.deleteUser(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('deletes user from database', async () => {
      const admin = await createAdmin();
      const target = await createCandidate();
      const req = mockReq({
        params: { id: target._id.toString() },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.deleteUser(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');

      const deleted = await User.findById(target._id);
      expect(deleted).toBeNull();
    });
  });

  describe('bulkUserActions', () => {
    it('returns 400 when action or userIds missing', async () => {
      const admin = await createAdmin();
      const req = mockReq({
        body: { action: 'activate' },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.bulkUserActions(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid request');
    });

    it('returns 400 when changeRole action lacks role data', async () => {
      const admin = await createAdmin();
      const target = await createCandidate();
      const req = mockReq({
        body: { action: 'changeRole', userIds: [target._id.toString()] },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.bulkUserActions(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Role is required');
    });

    it('changes role for multiple users', async () => {
      const admin = await createAdmin();
      const target = await createCandidate();
      const req = mockReq({
        body: {
          action: 'changeRole',
          userIds: [target._id.toString()],
          data: { role: 'freelancer' },
        },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.bulkUserActions(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.modifiedCount).toBe(1);

      const updated = await User.findById(target._id);
      expect(updated.role).toBe('freelancer');
    });
  });

  describe('getAllJobs', () => {
    it('returns paginated jobs list', async () => {
      await createActiveJob({ title: 'Admin Job List Item' });

      const req = mockReq({ query: { page: '1', limit: '10' } });
      const res = mockRes();

      await adminController.getAllJobs(req, res);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.jobs)).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('filters jobs by status', async () => {
      await createActiveJob({ title: 'Active Filter Job', status: 'active' });
      await createActiveJob({ title: 'Draft Filter Job', status: 'draft' });

      const req = mockReq({ query: { status: 'draft', limit: '50' } });
      const res = mockRes();

      await adminController.getAllJobs(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.jobs.every((j) => j.status === 'draft')).toBe(true);
    });
  });

  describe('updateJob', () => {
    it('returns 400 when title or status missing', async () => {
      const job = await createActiveJob();
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: job._id.toString() },
        body: { title: 'Missing Status' },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.updateJob(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Title and status are required fields');
    });

    it('updates job and persists to database', async () => {
      const job = await createActiveJob({ title: 'Original Admin Job' });
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: job._id.toString() },
        body: { title: 'Updated Admin Job', status: 'closed' },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.updateJob(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Admin Job');

      const updated = await Job.findById(job._id);
      expect(updated.title).toBe('Updated Admin Job');
      expect(updated.status).toBe('closed');
    });
  });

  describe('deleteJob', () => {
    it('deletes job from database', async () => {
      const job = await createActiveJob();
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: job._id.toString() },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.deleteJob(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Job deleted successfully');

      const deleted = await Job.findById(job._id);
      expect(deleted).toBeNull();
    });
  });

  describe('getSystemSettings', () => {
    it('returns default settings when none exist', async () => {
      await SystemSettings.deleteMany({});
      const admin = await createAdmin();
      const req = mockReq({ user: { _id: admin._id } });
      const res = mockRes();

      await adminController.getSystemSettings(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();

      const settings = await SystemSettings.findOne();
      expect(settings).not.toBeNull();
    });
  });

  describe('updateSystemSettings', () => {
    it('updates system settings in database', async () => {
      const admin = await createAdmin();
      const req = mockReq({
        body: { allowRegistrations: false },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.updateSystemSettings(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.allowRegistrations).toBe(false);
    });
  });

  describe('getPlatformAnalytics', () => {
    it('returns platform analytics summary', async () => {
      await createCandidate();
      await createCompanyWithUser();

      const req = mockReq();
      const res = mockRes();

      await adminController.getPlatformAnalytics(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(1);
      assertNoPassword(res.body);
    });
  });

  describe('updateUserStatus', () => {
    it('returns 404 for unknown user', async () => {
      const req = mockReq({
        params: { id: '507f1f77bcf86cd799439011' },
        body: { status: 'suspended', suspensionReason: 'Test' },
      });
      const res = mockRes();

      await adminController.updateUserStatus(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('updates user status and deactivates suspended users', async () => {
      const target = await createCandidate();
      const req = mockReq({
        params: { id: target._id.toString() },
        body: { status: 'suspended', suspensionReason: 'Policy violation' },
      });
      const res = mockRes();

      await adminController.updateUserStatus(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      assertNoPassword(res.body);

      const updated = await User.findById(target._id);
      expect(updated.isActive).toBe(false);
    });
  });

  describe('moderateTender', () => {
    it('returns 404 for unknown tender', async () => {
      const req = mockReq({
        params: { id: '507f1f77bcf86cd799439011' },
        body: { action: 'flag', reason: 'Spam' },
      });
      const res = mockRes();

      await adminController.moderateTender(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('flags tender and updates database', async () => {
      const tender = await createProfessionalTender();
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: tender._id.toString() },
        body: { action: 'flag', reason: 'Inappropriate content' },
        user: { _id: admin._id },
      });
      const res = mockRes();

      await adminController.moderateTender(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.moderated).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
    });
  });

  describe('generateReport', () => {
    it('returns 400 for unknown report type', async () => {
      const admin = await createAdmin();
      const req = mockReq({
        body: { type: 'unknown_type', title: 'Test Report' },
        user: { _id: admin._id },
      });
      const res = mockRes();
      await adminController.generateReport(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('generates users report', async () => {
      await createCandidate();
      const admin = await createAdmin();
      const req = mockReq({
        body: { type: 'users', title: 'Users Report' },
        user: { _id: admin._id },
      });
      const res = mockRes();
      await adminController.generateReport(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.type).toBe('users');
    });
  });

  describe('getReports', () => {
    it('returns reports list', async () => {
      const admin = await createAdmin();
      await Report.create({
        title: 'Test Report',
        type: 'users',
        data: { count: 1 },
        generatedBy: admin._id,
      });
      const req = mockReq({ query: { page: 1, limit: 10 } });
      const res = mockRes();
      await adminController.getReports(req, res);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.reports)).toBe(true);
    });
  });

  describe('getAllTenders', () => {
    it('returns paginated tenders list', async () => {
      await createProfessionalTender();
      const admin = await createAdmin();
      const req = mockReq({
        query: { page: 1, limit: 10 },
        user: { _id: admin._id },
      });
      const res = mockRes();
      await adminController.getAllTenders(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getTenderDetails', () => {
    it('returns 404 for unknown tender', async () => {
      const req = mockReq({ params: { id: new mongoose.Types.ObjectId().toString() } });
      const res = mockRes();
      await adminController.getTenderDetails(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('updateTenderStatus', () => {
    it('returns 404 for unknown tender', async () => {
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: { status: 'cancelled', reason: 'Test' },
        user: { _id: admin._id },
      });
      const res = mockRes();
      await adminController.updateTenderStatus(req, res);
      expect(res.statusCode).toBe(404);
    });

    it('updates tender status', async () => {
      const tender = await createProfessionalTender({ status: 'published' });
      const admin = await createAdmin();
      const req = mockReq({
        params: { id: tender._id.toString() },
        body: { status: 'cancelled', reason: 'Policy violation' },
        user: { _id: admin._id },
      });
      const res = mockRes();
      await adminController.updateTenderStatus(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('bulkTenderActions', () => {
    it('returns 400 when action missing', async () => {
      const req = mockReq({ body: { tenderIds: [] } });
      const res = mockRes();
      await adminController.bulkTenderActions(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('getSuspiciousTenders', () => {
    it('returns suspicious tenders list', async () => {
      const req = mockReq({ query: { page: 1, limit: 10 } });
      const res = mockRes();
      await adminController.getSuspiciousTenders(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('getAllProposals', () => {
    it('returns proposals list', async () => {
      const req = mockReq({ query: { page: 1, limit: 10 } });
      const res = mockRes();
      await adminController.getAllProposals(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('bulkUserActions deactivate', () => {
    it('deactivates users in bulk', async () => {
      const admin = await createAdmin();
      const target = await createCandidate();
      const req = mockReq({
        body: { action: 'deactivate', userIds: [target._id.toString()] },
        user: { _id: admin._id },
      });
      const res = mockRes();
      await adminController.bulkUserActions(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.modifiedCount).toBe(1);

      const updated = await User.findById(target._id);
      expect(updated.isActive).toBe(false);
    });
  });
});
