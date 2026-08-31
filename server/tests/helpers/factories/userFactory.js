const { createUser } = require('../auth');

async function createCandidate(overrides = {}) {
  return createUser({ role: 'candidate', ...overrides });
}

async function createFreelancer(overrides = {}) {
  return createUser({ role: 'freelancer', ...overrides });
}

async function createCompanyUser(overrides = {}) {
  return createUser({ role: 'company', ...overrides });
}

async function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', ...overrides });
}

module.exports = {
  createCandidate,
  createFreelancer,
  createCompanyUser,
  createAdmin,
};
