/**
 * CharityAI Load Testing — Excel Report Generator
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../config/load.config');

const STATUS_COLORS = { PASS: 'FF28A745', FAIL: 'FFDC3545', WARN: 'FFFFC107' };

function styleHeader(ws, rowNum) {
  ws.getRow(rowNum).eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D3B66' } };
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  ws.getRow(rowNum).height = 30;
}

function styleCell(c) {
  c.alignment = { vertical: 'top', wrapText: true };
  c.border = { top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } } };
}

async function generateExcelReport(testResults, scenarioStats = {}, metadata = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CharityAI Performance QA';
  wb.created = new Date();

  // Sheet 1: Summary
  const s1 = wb.addWorksheet('Summary');
  s1.columns = [{ header: 'Metric', key: 'm', width: 35 }, { header: 'Value', key: 'v', width: 45 }];
  styleHeader(s1, 1);
  [
    ['Test Suite', 'CharityAI Performance & Load Test'],
    ['Target Environment', config.API_BASE_URL],
    ['Scenario', metadata.scenario || 'Mixed Load'],
    ['Virtual Users (VUs)', metadata.vus || 'N/A'],
    ['Test Duration', metadata.duration || 'N/A'],
    ['Total Requests Sent', scenarioStats.totalRequests || 0],
    ['Successful Requests', scenarioStats.successRequests || 0],
    ['Failed Requests', scenarioStats.failedRequests || 0],
    ['Error Rate %', `${(scenarioStats.errorRate || 0).toFixed(2)}%`],
    ['Requests / Sec (RPS)', (scenarioStats.rps || 0).toFixed(2)],
    ['Min Latency (ms)', scenarioStats.minMs || 0],
    ['Avg Latency (ms)', (scenarioStats.avgMs || 0).toFixed(2)],
    ['P90 Latency (ms)', scenarioStats.p90Ms || 0],
    ['P95 Latency (ms)', scenarioStats.p95Ms || 0],
    ['P99 Latency (ms)', scenarioStats.p99Ms || 0],
    ['Max Latency (ms)', scenarioStats.maxMs || 0],
    ['SLA P95 Threshold (ms)', `${config.SLA.P95_RESPONSE_TIME_MS} ms`],
    ['SLA Status', scenarioStats.slaPassed ? 'PASS' : 'FAIL'],
    ['Report Date', new Date().toISOString()],
  ].forEach(([m, v]) => {
    const row = s1.addRow({ m, v: String(v) });
    row.eachCell(c => { styleCell(c); c.font = { name: 'Calibri', size: 11 }; });
  });

  // Sheet 2: Endpoint Performance Breakdown
  const s2 = wb.addWorksheet('Endpoint Performance');
  s2.columns = [
    { header: 'Endpoint / Transaction', key: 'endpoint', width: 35 },
    { header: 'HTTP Method', key: 'method', width: 12 },
    { header: 'Requests', key: 'requests', width: 12 },
    { header: 'Successes', key: 'successes', width: 12 },
    { header: 'Failures', key: 'failures', width: 12 },
    { header: 'Error %', key: 'errorRate', width: 12 },
    { header: 'Min (ms)', key: 'minMs', width: 12 },
    { header: 'Avg (ms)', key: 'avgMs', width: 12 },
    { header: 'P95 (ms)', key: 'p95Ms', width: 12 },
    { header: 'Max (ms)', key: 'maxMs', width: 12 },
    { header: 'Status vs SLA', key: 'status', width: 15 },
  ];
  styleHeader(s2, 1);

  (testResults || []).forEach(r => {
    const row = s2.addRow({
      endpoint: r.endpoint || '',
      method: r.method || 'GET',
      requests: r.requests || 0,
      successes: r.successes || 0,
      failures: r.failures || 0,
      errorRate: `${(r.errorRate || 0).toFixed(2)}%`,
      minMs: r.minMs || 0,
      avgMs: (r.avgMs || 0).toFixed(2),
      p95Ms: r.p95Ms || 0,
      maxMs: r.maxMs || 0,
      status: r.status || 'PASS',
    });
    const sc = row.getCell('status');
    sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_COLORS[r.status] || 'FF6C757D' } };
    sc.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.eachCell(c => styleCell(c));
    row.height = 24;
  });

  // Sheet 3: SLA Verification
  const s3 = wb.addWorksheet('SLA Compliance');
  s3.columns = [
    { header: 'SLA Metric', key: 'metric', width: 35 },
    { header: 'Target Threshold', key: 'target', width: 20 },
    { header: 'Actual Value', key: 'actual', width: 20 },
    { header: 'Compliance Status', key: 'status', width: 20 },
  ];
  styleHeader(s3, 1);

  [
    ['P95 Response Time', `<= ${config.SLA.P95_RESPONSE_TIME_MS} ms`, `${scenarioStats.p95Ms || 0} ms`, (scenarioStats.p95Ms || 0) <= config.SLA.P95_RESPONSE_TIME_MS ? 'PASS' : 'FAIL'],
    ['Error Rate', `<= ${config.SLA.MAX_ERROR_RATE_PERCENT}%`, `${(scenarioStats.errorRate || 0).toFixed(2)}%`, (scenarioStats.errorRate || 0) <= config.SLA.MAX_ERROR_RATE_PERCENT ? 'PASS' : 'FAIL'],
    ['Requests / Sec', `>= ${config.SLA.MIN_SUCCESSFUL_RPS} RPS`, `${(scenarioStats.rps || 0).toFixed(2)} RPS`, (scenarioStats.rps || 0) >= config.SLA.MIN_SUCCESSFUL_RPS ? 'PASS' : 'FAIL'],
  ].forEach(([m, t, a, s]) => {
    const row = s3.addRow({ metric: m, target: t, actual: a, status: s });
    row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_COLORS[s] || 'FF6C757D' } };
    row.getCell('status').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.eachCell(c => styleCell(c));
  });

  // Sheet 4: Environment
  const s4 = wb.addWorksheet('Load Profile Config');
  s4.columns = [{ header: 'Parameter', key: 'p', width: 30 }, { header: 'Setting', key: 's', width: 50 }];
  styleHeader(s4, 1);
  [
    ['API_BASE_URL', config.API_BASE_URL],
    ['SLA_P95_MS', `${config.SLA.P95_RESPONSE_TIME_MS}ms`],
    ['SLA_MAX_ERROR_RATE', `${config.SLA.MAX_ERROR_RATE_PERCENT}%`],
    ['SLA_MIN_RPS', config.SLA.MIN_SUCCESSFUL_RPS],
    ['Smoke Profile', JSON.stringify(config.LOAD_PROFILES.smoke)],
    ['Load Profile', JSON.stringify(config.LOAD_PROFILES.load)],
    ['Stress Profile', JSON.stringify(config.LOAD_PROFILES.stress)],
    ['Spike Profile', JSON.stringify(config.LOAD_PROFILES.spike)],
    ['Soak Profile', JSON.stringify(config.LOAD_PROFILES.soak)],
  ].forEach(([p, s]) => { const row = s4.addRow({ p, s: String(s) }); row.eachCell(c => styleCell(c)); });

  if (!fs.existsSync(config.REPORT_DIR)) fs.mkdirSync(config.REPORT_DIR, { recursive: true });
  const filePath = path.join(config.REPORT_DIR, config.EXCEL_FILENAME);
  await wb.xlsx.writeFile(filePath);
  console.log(`\n⚡ Load Test Excel report: ${filePath}`);
  return filePath;
}

module.exports = { generateExcelReport };
