const path = require('path');

const workerId = process.env.JEST_WORKER_ID || '1';
const uploadRoot = path.join(__dirname, '..', '..', `tmp-test-uploads-${workerId}`);

process.env.NODE_ENV = 'development';
process.env.UPLOAD_BASE_PATH = uploadRoot;
process.env.UPLOADS_DIR = uploadRoot;
