#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (!summaryPath) {
  process.exit(0);
}

const reports = [
  { label: 'Unit', file: path.join('reports', 'unit', 'jest-unit.json') },
  { label: 'Integration', file: path.join('reports', 'integration', 'jest-integration.json') },
];

let totalPassed = 0;
let totalFailed = 0;
let totalTests = 0;
let totalSuitesPassed = 0;
let totalSuites = 0;
let failedSuites = [];

for (const { label, file } of reports) {
  try {
    const report = JSON.parse(fs.readFileSync(file, 'utf8'));
    totalPassed += report.numPassedTests;
    totalFailed += report.numFailedTests;
    totalTests += report.numTotalTests;
    totalSuitesPassed += report.numPassedTestSuites;
    totalSuites += report.numTotalTestSuites;

    for (const suite of report.testResults.filter((item) => item.status === 'failed')) {
      failedSuites.push(`${label}: ${path.basename(suite.name)}`);
    }
  } catch {
    failedSuites.push(`${label}: report missing`);
  }
}

const overall = totalFailed === 0 && !failedSuites.some((item) => item.includes('missing'))
  ? '✅ All backend tests passed'
  : '❌ Backend tests failed';

let markdown = `## ${overall}\n\n`;
markdown += `**Commit:** \`${process.env.GITHUB_SHA?.slice(0, 7) || 'local'}\`  \n`;
markdown += `**Ref:** \`${process.env.GITHUB_REF_NAME || 'local'}\`  \n\n`;
markdown += '| Metric | Value |\n';
markdown += '|--------|-------|\n';
markdown += `| Tests passed | ${totalPassed} |\n`;
markdown += `| Tests failed | ${totalFailed} |\n`;
markdown += `| Total tests | ${totalTests} |\n`;
markdown += `| Suites passed | ${totalSuitesPassed}/${totalSuites} |\n`;

if (failedSuites.length > 0) {
  markdown += '\n### Failures\n\n';
  for (const suite of failedSuites) {
    markdown += `- ${suite}\n`;
  }
}

fs.writeFileSync(summaryPath, markdown);

if (totalFailed > 0 || failedSuites.some((item) => item.includes('missing'))) {
  process.exit(1);
}
