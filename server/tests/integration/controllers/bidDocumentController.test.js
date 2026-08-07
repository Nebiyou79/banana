const bidDocumentController = require('../../../src/controllers/bidDocumentController');
const { mockReq, mockRes } = require('../../helpers/mockHttp');

describe('bidDocumentController integration', () => {
  describe('downloadBidDocument', () => {
    it('returns 404 when bid not found', async () => {
      const req = mockReq({
        params: {
          tenderId: '507f1f77bcf86cd799439011',
          bidId: '507f1f77bcf86cd799439012',
          fileName: 'doc.pdf',
        },
        user: { _id: '507f1f77bcf86cd799439013', role: 'company' },
      });
      const res = mockRes();

      await bidDocumentController.downloadBidDocument(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('previewBidDocument', () => {
    it('returns 404 when bid not found', async () => {
      const req = mockReq({
        params: {
          tenderId: '507f1f77bcf86cd799439011',
          bidId: '507f1f77bcf86cd799439012',
          fileName: 'missing.pdf',
        },
        user: { _id: '507f1f77bcf86cd799439013', role: 'company' },
      });
      const res = mockRes();

      await bidDocumentController.previewBidDocument(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
