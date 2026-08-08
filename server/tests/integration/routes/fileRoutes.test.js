const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { getApp } = require('../../helpers/app');
const { createUser, authHeader } = require('../../helpers/auth');

describe('fileRoutes integration', () => {
  const app = getApp();

  describe('GET /api/v1/uploads/:folder/:filename', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/v1/uploads/cv/test-file.pdf');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for disallowed folder when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/uploads/avatars/test-file.pdf')
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid folder/i);
    });
  });

  describe('GET /api/v1/file-info/:folder/:filename', () => {
    it('returns exists false for missing file when authenticated', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/file-info/cv/nonexistent-file.pdf')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.exists).toBe(false);
    });

    it('returns exists true for uploaded local file', async () => {
      const user = await createUser();
      const filename = `route-file-${Date.now()}.txt`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'cv');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, 'route test file');

      const res = await request(app)
        .get(`/api/v1/file-info/cv/${filename}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.exists).toBe(true);

      fs.unlinkSync(filePath);
    });
  });

  describe('GET /api/v1/text-content/:type/:filename', () => {
    it('returns generated reference text content', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/text-content/applications/reference-0-0.txt')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('REFERENCE DETAILS');
    });

    it('returns 400 for invalid text content filename', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/text-content/applications/invalid-name.txt')
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/uploads/:folder/:filename file serving', () => {
    it('serves local cv file when it exists', async () => {
      const user = await createUser();
      const filename = `download-${Date.now()}.pdf`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'cv');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, '%PDF-1.4 test content');

      const res = await request(app)
        .get(`/api/v1/uploads/cv/${filename}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');

      fs.unlinkSync(filePath);
    });

    it('returns 404 for missing local file', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/uploads/cv/nonexistent-file.pdf')
        .set(authHeader(user._id));

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('serves reference text placeholder via uploads route', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/uploads/applications/reference-0-0.txt')
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.text).toContain('REFERENCE DETAILS');
    });

    it('redirects for cloudinary URL filename', async () => {
      const user = await createUser();
      const cloudinaryUrl = encodeURIComponent(
        'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg'
      );
      const res = await request(app)
        .get(`/api/v1/uploads/cv/${cloudinaryUrl}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(302);
    });
  });

  describe('GET /api/v1/uploads/:folder/view/:filename', () => {
    it('returns 400 for invalid folder', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/uploads/invalid-folder/view/test.pdf')
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
    });

    it('views local pdf inline', async () => {
      const user = await createUser();
      const filename = `view-${Date.now()}.pdf`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, '%PDF-1.4 view test');

      const res = await request(app)
        .get(`/api/v1/uploads/documents/view/${filename}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('inline');

      fs.unlinkSync(filePath);
    });

    it('returns 400 for non-inline file type', async () => {
      const user = await createUser();
      const filename = `doc-${Date.now()}.docx`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'cv');
      fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, 'docx content');

      const res = await request(app)
        .get(`/api/v1/uploads/cv/view/${filename}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be viewed inline/i);

      fs.unlinkSync(filePath);
    });
  });

  describe('GET /api/v1/cloudinary/download/:publicId', () => {
    it('returns error when cloudinary route unavailable', async () => {
      const user = await createUser();
      const res = await request(app)
        .get('/api/v1/cloudinary/download/test-folder/sample-file')
        .query({ filename: 'sample.pdf' })
        .set(authHeader(user._id));

      expect([302, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/v1/file-info/:folder/:filename cloudinary', () => {
    it('returns cloudinary file info for valid URL', async () => {
      const user = await createUser();
      const cloudinaryUrl = encodeURIComponent(
        'https://res.cloudinary.com/demo/image/upload/v1234567890/folder/sample.jpg'
      );
      const res = await request(app)
        .get(`/api/v1/file-info/cv/${cloudinaryUrl}`)
        .set(authHeader(user._id));

      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(true);
      expect(res.body.source).toBe('cloudinary');
    });
  });
});
