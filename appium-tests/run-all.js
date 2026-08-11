/**
 * CharityAI Appium — Master Test Runner
 * Runs all mobile test suites, collects results, generates Excel report.
 */
require('dotenv').config();
const { checkAndroidEnvironment } = require('./config/appium.config');
const { runLoginTests } = require('./tests/login-tests');
const { runRegistrationTests } = require('./tests/registration-tests');
const { runDashboardTests, runDonationTests, runNGOTests, runRequestTests, runNavigationTests, runSynchronizationTests, runValidationTests, runGeneratedTests } = require('./tests/dashboard-tests');
const { generateExcelReport } = require('./utils/excel-report');
const config = require('./config/appium.config');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('═'.repeat(70));
  console.log('  CharityAI Appium Android E2E Test Suite');
  console.log(`  Appium: ${config.APPIUM_SERVER_URL}`);
  console.log(`  Device: ${config.ANDROID_DEVICE_NAME}`);
  console.log(`  App: ${config.ANDROID_APP_PATH || 'N/A'}`);
  console.log('═'.repeat(70));

  const env = await checkAndroidEnvironment();
  if (!env.available) {
    console.log(`\n⚠️  Android environment not available: ${env.reason}`);
    console.log('    All tests will be reported as BLOCKED.\n');
  }

  const startTime = new Date();
  let allResults = [];

  const suites = [
    { name: 'Login', fn: runLoginTests },
    { name: 'Registration', fn: runRegistrationTests },
    { name: 'Dashboard', fn: runDashboardTests },
    { name: 'Donation', fn: runDonationTests },
    { name: 'NGO', fn: runNGOTests },
    { name: 'Requests', fn: runRequestTests },
    { name: 'Navigation', fn: runNavigationTests },
    { name: 'Synchronization', fn: runSynchronizationTests },
    { name: 'Validation', fn: runValidationTests },
    { name: 'Extended', fn: runGeneratedTests },
  ];

  for (const suite of suites) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶ Running: ${suite.name} Tests`);
    console.log('─'.repeat(60));
    try {
      const results = await suite.fn();
      allResults = allResults.concat(results);
      const p = results.filter(r => r.status === 'PASS').length;
      const f = results.filter(r => r.status === 'FAIL').length;
      const b = results.filter(r => r.status === 'BLOCKED').length;
      console.log(`  ✔ ${suite.name}: ${results.length} tests | ✅ ${p} PASS | ❌ ${f} FAIL | ⚠️ ${b} BLOCKED`);
    } catch (e) {
      console.error(`  ✖ ${suite.name} suite FAILED: ${e.message}`);
    }
  }

  const endTime = new Date();
  const durationMs = endTime - startTime;
  const duration = `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;
  const pass = allResults.filter(r => r.status === 'PASS').length;
  const fail = allResults.filter(r => r.status === 'FAIL').length;
  const blocked = allResults.filter(r => r.status === 'BLOCKED').length;
  const total = allResults.length;
  const passPercent = total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00';

  console.log('\n' + '═'.repeat(70));
  console.log(`  TOTAL: ${total} | PASS: ${pass} (${passPercent}%) | FAIL: ${fail} | BLOCKED: ${blocked}`);
  console.log('═'.repeat(70));

  try {
    await generateExcelReport(allResults, {
      device: config.ANDROID_DEVICE_NAME,
      appPath: config.ANDROID_APP_PATH,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    });
  } catch (e) { console.error('Excel report failed:', e.message); }

  // GitHub Actions Step Summary
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    let summary = `# CharityAI Appium Android Test Report\n\n`;
    summary += `| Metric | Value |\n|--------|-------|\n`;
    summary += `| Total Tests | ${total} |\n| ✅ Passed | ${pass} |\n| ❌ Failed | ${fail} |\n| ⚠️ Blocked | ${blocked} |\n| Pass % | ${passPercent}% |\n| Duration | ${duration} |\n`;
    if (!env.available) summary += `\n> ⚠️ **All tests BLOCKED**: Android environment not available. ${env.reason}\n`;
    fs.writeFileSync(summaryFile, summary);
  }

  if (!fs.existsSync(config.REPORT_DIR)) fs.mkdirSync(config.REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(config.REPORT_DIR, 'appium-summary.json'), JSON.stringify({ total, pass, fail, blocked, passPercent, duration, startTime, endTime, androidAvailable: env.available }, null, 2));
}

main().catch(e => { console.error('Runner error:', e); process.exit(1); });
