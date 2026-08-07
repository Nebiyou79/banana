function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
  };
  res.status = jest.fn(function status(code) {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(function json(payload) {
    res.body = payload;
    return res;
  });
  res.send = jest.fn(function send(payload) {
    res.body = payload;
    return res;
  });
  res.setHeader = jest.fn(function setHeader(key, value) {
    res.headers[key] = value;
    return res;
  });
  res.download = jest.fn(function download() {
    return res;
  });
  return res;
}

function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ip: '127.0.0.1',
    get: jest.fn(() => 'jest-test-agent'),
    ...overrides,
  };
}

function mockNext() {
  return jest.fn();
}

module.exports = { mockReq, mockRes, mockNext };
