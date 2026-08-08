const mongoose = require('mongoose');
const connectDB = require('../../../src/config/db');

describe('db config', () => {
  let originalUri;

  beforeAll(() => {
    originalUri = process.env.MONGODB_URI;
  });

  afterAll(async () => {
    process.env.MONGODB_URI = originalUri;
  });

  it('connects to MongoDB when MONGODB_URI is set', async () => {
    const conn = await connectDB();
    expect(conn.connection.readyState).toBe(1);
    expect(conn.connection.host).toBeTruthy();
  });

  it('reuses existing mongoose connection', async () => {
    process.env.MONGODB_URI = originalUri;
    const first = await connectDB();
    const second = await connectDB();
    expect(second.connection.id).toBe(first.connection.id);
  });

  it('throws when MONGODB_URI is not defined', async () => {
    delete process.env.MONGODB_URI;
    await expect(connectDB()).rejects.toThrow('MONGODB environment variable is not defined');
    process.env.MONGODB_URI = originalUri;
  });
});
