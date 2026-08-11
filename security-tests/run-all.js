/**
 * CharityAI Security — Master Penetration & Security Test Runner
 * Orchestrates all 300+ security tests, builds OWASP risk report, generates Excel report.
 */
require('dotenv').config();
const { checkApiReachable } = require('./utils/http');
const { runAuthSecurityTests } = require('./tests/auth-security-tests');
const { runInjectionTests } = require('./tests/injection-tests');
const { runAccessControlTests } = require('./tests/access-control-tests');
const { runSecurityHeadersTests } = require('./tests/security-headers-tests');
const { runRateLimitTests } = require('./tests/rate-limit-tests');
const { runDataExposureTests } = require('./tests/data-exposure-tests');
const { runGeneratedSecurityTests } = require('./tests/generated-security-tests');
const { generateExcelReport } = require('./utils/excel-report');
const config = require('./config/security.config');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('═'.repeat(70));
  console.log('  CharityAI API Security & Penetration Testing Suite');
  console.log(`  API Target: ${config.API_BASE_URL}`);
  console.log(`  Web Target: ${config.WEB_BASE_URL}`);
  console.log('═'.repeat(70));

  const reach = await checkApiReachable();
  if (!reach.reachable) {
    console.log(`\n⚠️  API Target not reachable: ${reach.error}`);
    console.log('    All security tests will be marked as BLOCKED.\n');
  }

  const startTime = new Date();
  let allResults = [];

  const suites = [
    { name: 'Authentication Security', fn: runAuthSecurityTests },
    { name: 'Injection Vulnerabilities', fn: runInjectionTests },
    { name: 'Broken Access Control', fn: runAccessControlTests },
    { name: 'Security Headers', fn: runSecurityHeadersTests },
    { name: 'Rate Limiting & DoS', fn: runRateLimitTests },
    { name: 'Sensitive Data Exposure', fn: runDataExposureTests },
    { name: 'Extended OWASP Security', fn: runGeneratedSecurityTests },
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
      const w = results.filter(r => r.status === 'WARN').length;
      const b = results.filter(r => r.status === 'BLOCKED').length;
      console.log(`  ✔ ${suite.name}: ${results.length} tests | ✅ ${p} PASS | ❌ ${f} VULNERABLE | ⚠️ ${w} WARN | ⛔ ${b} BLOCKED`);
    } catch (e) {
      console.error(`  ✖ ${suite.name} suite FAILED: ${e.message}`);
    }
  }

  const endTime = new Date();
  const durationMs = endTime - startTime;
  const duration = `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;

  const pass = allResults.filter(r => r.status === 'PASS').length;
  const fail = allResults.filter(r => r.status === 'FAIL').length;
  const warn = allResults.filter(r => r.status === 'WARN').length;
  const blocked = allResults.filter(r => r.status === 'BLOCKED').length;
  const total = allResults.length;
  const passPercent = total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00';

  const criticalFails = allResults.filter(r => r.status === 'FAIL' && r.severity === 'CRITICAL');
  const highFails = allResults.filter(r => r.status === 'FAIL' && r.severity === 'HIGH');

  console.log('\n' + '═'.repeat(70));
  console.log('  SECURITY SCAN RESULTS SUMMARY');
  console.log('═'.repeat(70));
  console.log(`  Total Tests:    ${total}`);
  console.log(`  ✅ Secure (PASS): ${pass} (${passPercent}%)`);
  console.log(`  ❌ Vulnerable:   ${fail} (CRITICAL: ${criticalFails.length}, HIGH: ${highFails.length})`);
  console.log(`  ⚠️ Warnings:     ${warn}`);
  console.log(`  ⛔ Blocked:      ${blocked}`);
  console.log(`  Duration:       ${duration}`);
  console.log('═'.repeat(70));

  try {
    await generateExcelReport(allResults, { startTime: startTime.toISOString(), endTime: endTime.toISOString(), duration });
  } catch (e) { console.error('Excel report failed:', e.message); }

  // GitHub Step Summary
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    let summary = `# CharityAI API Security & Penetration Testing Report\n\n`;
    summary += `| Metric | Value |\n|--------|-------|\n`;
    summary += `| Total Security Tests | ${total} |\n`;
    summary += `| ✅ Passed (Secure) | ${pass} |\n`;
    summary += `| ❌ Failed (Vulnerable) | ${fail} |\n`;
    summary += `| 🔴 Critical Vulnerabilities | ${criticalFails.length} |\n`;
    summary += `| 🟠 High Vulnerabilities | ${highFails.length} |\n`;
    summary += `| ⚠️ Warnings | ${warn} |\n`;
    summary += `| Secure % | ${passPercent}% |\n`;
    summary += `| Target API | ${config.API_BASE_URL} |\n\n`;

    if (criticalFails.length > 0 || highFails.length > 0) {
      summary += `## ❌ Security Vulnerabilities Found\n\n| ID | Risk | OWASP | Name | Recommendation |\n|----|------|-------|------|----------------|\n`;
      [...criticalFails, ...highFails].forEach(v => {
        summary += `| ${v.id} | ${v.severity} | ${v.owasp || ''} | ${v.name} | ${(v.recommendation || '').substring(0, 80)} |\n`;
      });
    }
    fs.writeFileSync(summaryFile, summary);
  }

  if (!fs.existsSync(config.REPORT_DIR)) fs.mkdirSync(config.REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(config.REPORT_DIR, 'security-summary.json'), JSON.stringify({ total, pass, fail, warn, blocked, criticalFails: criticalFails.length, highFails: highFails.length, passPercent, duration, startTime, endTime }, null, 2));

  if (criticalFails.length > 0) {
    console.log(`\n🔴 Security scan failed with ${criticalFails.length} CRITICAL vulnerabilities!`);
    process.exit(1);
  }
}

main().catch(e => { console.error('Runner error:', e); process.exit(1); });
