const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.DIGEST_CRON_ENABLED = 'false';

const workerId = process.env.JEST_WORKER_ID || '1';
process.env.UPLOAD_BASE_PATH = path.join(__dirname, '..', '..', `tmp-test-uploads-${workerId}`);
process.env.UPLOADS_DIR = process.env.UPLOAD_BASE_PATH;

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  if (!fs.existsSync(process.env.UPLOAD_BASE_PATH)) {
    fs.mkdirSync(process.env.UPLOAD_BASE_PATH, { recursive: true });
  }
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
