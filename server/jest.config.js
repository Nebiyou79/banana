/** @type {import('jest').Config} */
module.exports = {
  maxWorkers: '50%',
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFiles: ['<rootDir>/tests/setup/env.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/unit.setup.js'],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFiles: ['<rootDir>/tests/setup/env.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.setup.js'],
      testEnvironment: 'node',
    },
  ],
};
