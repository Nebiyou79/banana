#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const project = process.argv[2] || 'all';
const reportPath = path.join(__dirname, '..', 'reports', `jest-${project}.json`);
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!summaryPath) {
  process.exit(0);
}

let markdown = `### ${project} tests\n\n`;

try {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const runtimeSec = (
    report.testResults.reduce((total, suite) => total + suite.perfStats.runtime, 0) / 1000
  ).toFixed(1);

  const status = report.numFailedTests === 0 ? '✅ Passed' : '❌ Failed';

  markdown += `${status}\n\n`;
  markdown += '| Metric | Value |\n';
  markdown += '|--------|-------|\n';
  markdown += `| Tests passed | ${report.numPassedTests} |\n`;
  markdown += `| Tests failed | ${report.numFailedTests} |\n`;
  markdown += `| Total tests | ${report.numTotalTests} |\n`;
  markdown += `| Suites passed | ${report.numPassedTestSuites}/${report.numTotalTestSuites} |\n`;
  markdown += `| Runtime | ${runtimeSec}s |\n`;

  const failedSuites = report.testResults.filter((suite) => suite.status === 'failed');
  if (failedSuites.length > 0) {
    markdown += '\n**Failed suites**\n\n';
    for (const suite of failedSuites) {
      markdown += `- \`${path.basename(suite.name)}\`\n`;
    }
  }
} catch (error) {
  markdown += `Could not read test report: ${error.message}\n`;
}

fs.appendFileSync(summaryPath, `${markdown}\n`);
