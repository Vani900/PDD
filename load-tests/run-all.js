/**
 * CharityAI Load Testing — Master Test Runner
 * Executes Smoke, Load, Stress, Spike, Soak test scenarios, validates SLAs, generates Excel report.
 */
require('dotenv').config();
const { runLoadScenario } = require('./scenarios/api-load');
const { generateExcelReport } = require('./utils/excel-report');
const config = require('./config/load.config');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('═'.repeat(70));
  console.log('  CharityAI Performance & Load Testing Suite');
  console.log(`  Target API: ${config.API_BASE_URL}`);
  console.log(`  SLA P95 Threshold: ${config.SLA.P95_RESPONSE_TIME_MS} ms`);
  console.log(`  SLA Max Error Rate: ${config.SLA.MAX_ERROR_RATE_PERCENT}%`);
  console.log('═'.repeat(70));

  const startTime = new Date();
  const scenariosToRun = process.argv[2] ? [process.argv[2].replace('--scenario=', '')] : ['smoke', 'load'];

  let allEndpointRows = [];
  let aggregateStats = { totalRequests: 0, successRequests: 0, failedRequests: 0, errorRate: 0, rps: 0, p95Ms: 0, slaPassed: true };

  for (const scenarioName of scenariosToRun) {
    try {
      const { scenarioStats, endpointRows } = await runLoadScenario(scenarioName);
      allEndpointRows = allEndpointRows.concat(endpointRows);
      aggregateStats = scenarioStats;
    } catch (e) {
      console.error(`Scenario [${scenarioName}] failed:`, e.message);
    }
  }

  const endTime = new Date();
  const durationMs = endTime - startTime;
  const duration = `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`;

  // Generate Excel Report
  try {
    await generateExcelReport(allEndpointRows, aggregateStats, {
      scenario: scenariosToRun.join(', '),
      vus: config.LOAD_PROFILES[scenariosToRun[0]]?.vus || 10,
      duration,
    });
  } catch (e) { console.error('Excel report failed:', e.message); }

  // GitHub Step Summary
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    let summary = `# CharityAI Performance & Load Testing Report\n\n`;
    summary += `| Metric | Value |\n|--------|-------|\n`;
    summary += `| Total Requests | ${aggregateStats.totalRequests} |\n`;
    summary += `| Successful Requests | ${aggregateStats.successRequests} |\n`;
    summary += `| Error Rate | ${aggregateStats.errorRate.toFixed(2)}% |\n`;
    summary += `| Requests / Sec (RPS) | ${aggregateStats.rps.toFixed(2)} |\n`;
    summary += `| P95 Latency | ${aggregateStats.p95Ms} ms |\n`;
    summary += `| SLA P95 Target | <= ${config.SLA.P95_RESPONSE_TIME_MS} ms |\n`;
    summary += `| SLA Status | ${aggregateStats.slaPassed ? '✅ PASS' : '❌ FAIL'} |\n`;
    summary += `| Duration | ${duration} |\n\n`;

    fs.writeFileSync(summaryFile, summary);
  }

  if (!fs.existsSync(config.REPORT_DIR)) fs.mkdirSync(config.REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(config.REPORT_DIR, 'load-summary.json'), JSON.stringify({ ...aggregateStats, duration, startTime, endTime }, null, 2));

  console.log('\n✅ Load testing completed.');
}

main().catch(e => { console.error('Runner error:', e); process.exit(1); });
