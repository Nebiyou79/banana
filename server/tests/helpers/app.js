let cachedApp;

function getApp() {
  if (!cachedApp) {
    ({ app: cachedApp } = require('../../src/index'));
  }
  return cachedApp;
}

function resetApp() {
  cachedApp = undefined;
  jest.resetModules();
}

module.exports = { getApp, resetApp };
