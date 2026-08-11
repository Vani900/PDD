/**
 * CharityAI Selenium — Master Test Runner
 * Runs all 460+ test cases across 10 test suites, seeds test accounts, collects results,
 * generates Excel report, and outputs GitHub Step Summary.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { runLoginTests } = require('./tests/login-tests');
const { runRegistrationTests } = require('./tests/registration-tests');
const { runDashboardTests } = require('./tests/dashboard-tests');
const { runDonationTests } = require('./tests/donation-tests');
const { runNGOTests } = require('./tests/ngo-tests');
const { runProfileTests } = require('./tests/profile-tests');
const { runRequestTests } = require('./tests/request-tests');
const { runNavigationTests } = require('./tests/navigation-tests');
const { runValidationTests } = require('./tests/validation-tests');
const { runGeneratedTests } = require('./tests/generated-tests');
const { ensureTestUsersExist } = require('./utils/api');
const { generateExcelReport } = require('./utils/excel-report');
const config = require('./config/selenium.config');

async function main() {
  console.log('═'.repeat(70));
  console.log('  CharityAI Selenium Master E2E Suite (460+ Test Cases)');
  console.log(`  Web: ${config.WEB_BASE_URL}`);
  console.log(`  API: ${config.API_BASE_URL}`);
  console.log(`  Headless: ${config.HEADLESS}`);
  console.log('═'.repeat(70));

  // 1. Automatically seed / verify test users exist in backend API
  console.log('\n▶ Seeding / verifying test donor & NGO user accounts...');
  try {
    const seeded = await ensureTestUsersExist();
    if (seeded) console.log('  ✔ Test accounts verified successfully.');
    else console.log('  ⚠️  Backend API not reachable — test accounts check skipped.');
  } catch (e) {
    console.log(`  ⚠️  Account seeding warning: ${e.message}`);
  }

  const startTime = new Date();
  let allResults = [];

  const suites = [
    { name: 'Login', fn: runLoginTests },
    { name: 'Registration', fn: runRegistrationTests },
    { name: 'Dashboard', fn: runDashboardTests },
    { name: 'Donation', fn: runDonationTests },
    { name: 'NGO', fn: runNGOTests },
    { name: 'Profile', fn: runProfileTests },
    { name: 'Requests', fn: runRequestTests },
    { name: 'Navigation', fn: runNavigationTests },
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
      const s = results.filter(r => r.status === 'SKIPPED').length;
      console.log(`  ✔ ${suite.name}: ${results.length} tests | ✅ ${p} PASS | ❌ ${f} FAIL | ⚠️ ${b} BLOCKED | ⏭️ ${s} SKIPPED`);
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
  const skipped = allResults.filter(r => r.status === 'SKIPPED').length;
  const total = allResults.length;
  const passPercent = total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00';

  console.log('\n' + '═'.repeat(70));
  console.log('  FINAL RESULTS');
  console.log('═'.repeat(70));
  console.log(`  Total:   ${total}`);
  console.log(`  PASS:    ${pass} (${passPercent}%)`);
  console.log(`  FAIL:    ${fail}`);
  console.log(`  BLOCKED: ${blocked}`);
  console.log(`  SKIPPED: ${skipped}`);
  console.log(`  Duration: ${duration}`);
  console.log('═'.repeat(70));

  // ── Generate Excel Report ──────────────────────────────────────────────────
  try {
    await generateExcelReport(allResults, {
      suite: 'Selenium E2E',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      environment: config.WEB_BASE_URL,
      browser: config.HEADLESS ? 'Chrome (Headless)' : 'Chrome',
    });
  } catch (e) {
    console.error('Excel report generation failed:', e.message);
  }

  // ── GitHub Actions Step Summary ────────────────────────────────────────────
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    const failures = allResults.filter(r => r.status === 'FAIL');
    const blocked_list = allResults.filter(r => r.status === 'BLOCKED');
    let summary = `# CharityAI Selenium E2E Test Report\n\n`;
    summary += `| Metric | Value |\n|--------|-------|\n`;
    summary += `| Total Tests | ${total} |\n`;
    summary += `| ✅ Passed | ${pass} |\n`;
    summary += `| ❌ Failed | ${fail} |\n`;
    summary += `| ⚠️ Blocked | ${blocked} |\n`;
    summary += `| ⏭️ Skipped | ${skipped} |\n`;
    summary += `| Pass % | ${passPercent}% |\n`;
    summary += `| Duration | ${duration} |\n`;
    summary += `| Environment | ${config.WEB_BASE_URL} |\n\n`;

    if (failures.length > 0) {
      summary += `## ❌ Failed Tests\n\n| Test ID | Suite | Name | Error |\n|---------|-------|------|-------|\n`;
      failures.slice(0, 20).forEach(f => { summary += `| ${f.id} | ${f.suite} | ${f.name} | ${(f.error || f.actual || '').substring(0, 100)} |\n`; });
    }
    if (blocked_list.length > 0) {
      summary += `\n## ⚠️ Blocked Tests\n\n| Test ID | Reason |\n|---------|--------|\n`;
      blocked_list.slice(0, 10).forEach(b => { summary += `| ${b.id} | ${(b.actual || '').substring(0, 120)} |\n`; });
    }
    fs.writeFileSync(summaryFile, summary);
    console.log('GitHub Step Summary written.');
  }

  // Save JSON summary
  const reportDir = config.REPORT_DIR;
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'selenium-summary.json'), JSON.stringify({ total, pass, fail, blocked, skipped, passPercent, duration, startTime, endTime }, null, 2));

  if (fail > 0) {
    console.log(`\n⚠️  ${fail} test(s) FAILED. Exit code 1.`);
    process.exit(1);
  }
  console.log('\n✅ All executable tests completed.');
}

main().catch(e => { console.error('Runner error:', e); process.exit(1); });
