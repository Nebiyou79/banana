const { mockReq, mockRes, mockNext } = require('./mockHttp');

async function runController(handler, { req = {}, res = mockRes(), next = mockNext() } = {}) {
  const request = mockReq(req);
  await handler(request, res, next);
  return { req: request, res, next };
}

module.exports = { runController };
