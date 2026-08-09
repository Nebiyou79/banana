/** @type {import('jest').Config} */
const coverageCollect = [
  "src/**/*.js",
  "!src/templates/**",
  "!src/scripts/**",
  "!src/test-email.js",
];

module.exports = {
  maxWorkers: "100%",
  collectCoverageFrom: coverageCollect,
  coverageDirectory: "coverage",
  coverageReporters: ["text-summary", "lcov", "json-summary"],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 80,
      lines: 80,
    },
  },
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
      setupFiles: ["<rootDir>/tests/setup/env.setup.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/unit.setup.js"],
      testEnvironment: "node",
      collectCoverageFrom: coverageCollect,
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      setupFiles: ["<rootDir>/tests/setup/env.setup.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/integration.setup.js"],
      testEnvironment: "node",
      collectCoverageFrom: coverageCollect,
    },
  ],
};
