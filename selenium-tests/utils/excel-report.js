/**
 * CharityAI Excel Report Generator
 * Generates XLSX reports with Summary, Test Details, Failure Analysis, and Environment sheets.
 * Uses ExcelJS — NOT CSV renamed to XLSX.
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../config/selenium.config');

/**
 * @typedef {Object} TestResult
 * @property {string} id - Unique test ID
 * @property {string} suite - Test suite name
 * @property {string} category - Test category
 * @property {string} name - Test name
 * @property {string} description - Test description
 * @property {string} preconditions - Preconditions
 * @property {string} steps - Test steps
 * @property {string} expected - Expected result
 * @property {string} actual - Actual result
 * @property {'PASS'|'FAIL'|'BLOCKED'|'SKIPPED'} status - Test status
 * @property {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} severity - Severity
 * @property {string} error - Error message if any
 * @property {string} screenshot - Screenshot path if any
 * @property {string} executionTime - ISO timestamp
 * @property {number} duration - Duration in ms
 */

const STATUS_COLORS = {
  PASS: 'FF28A745',
  FAIL: 'FFDC3545',
  BLOCKED: 'FFFD7E14',
  SKIPPED: 'FF6C757D',
};

const SEVERITY_COLORS = {
  CRITICAL: 'FFDC3545',
  HIGH: 'FFFD7E14',
  MEDIUM: 'FFFFC107',
  LOW: 'FF28A745',
};

function styleHeader(worksheet, rowNum) {
  const row = worksheet.getRow(rowNum);
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };
  });
  row.height = 30;
}

function styleDataCell(cell, value) {
  cell.alignment = { vertical: 'top', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  };
}

/**
 * Generate a full XLSX report from test results.
 * @param {TestResult[]} results
 * @param {Object} metadata
 */
async function generateExcelReport(results, metadata = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CharityAI QA System';
  workbook.lastModifiedBy = 'CharityAI CI';
  workbook.created = new Date();
  workbook.modified = new Date();

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const blocked = results.filter(r => r.status === 'BLOCKED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const total = results.length;
  const passPercent = total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00';

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 40 },
  ];
  styleHeader(summarySheet, 1);

  const summaryData = [
    ['Total Tests', total],
    ['Passed', pass],
    ['Failed', fail],
    ['Blocked', blocked],
    ['Skipped', skipped],
    ['Pass Percentage', `${passPercent}%`],
    ['Start Time', metadata.startTime || new Date().toISOString()],
    ['End Time', metadata.endTime || new Date().toISOString()],
    ['Duration', metadata.duration || 'N/A'],
    ['Environment', metadata.environment || process.env.WEB_BASE_URL || 'localhost:3000'],
    ['Suite', metadata.suite || 'Selenium E2E'],
    ['Browser', metadata.browser || 'Chrome (Headless)'],
    ['Node Version', process.version],
    ['Report Generated', new Date().toISOString()],
  ];

  summaryData.forEach(([metric, value]) => {
    const row = summarySheet.addRow({ metric, value });
    row.eachCell((cell) => {
      styleDataCell(cell);
      cell.font = { name: 'Calibri', size: 11 };
    });
  });

  // Color PASS/FAIL counts
  summarySheet.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  summarySheet.getCell('B3').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  if (fail > 0) {
    summarySheet.getCell('B4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC3545' } };
    summarySheet.getCell('B4').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  }

  // ── Sheet 2: Test Details ────────────────────────────────────────────────────
  const detailSheet = workbook.addWorksheet('Test Details');
  detailSheet.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Suite', key: 'suite', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Test Name', key: 'name', width: 35 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Preconditions', key: 'preconditions', width: 30 },
    { header: 'Steps', key: 'steps', width: 50 },
    { header: 'Expected Result', key: 'expected', width: 35 },
    { header: 'Actual Result', key: 'actual', width: 35 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Error', key: 'error', width: 40 },
    { header: 'Screenshot', key: 'screenshot', width: 30 },
    { header: 'Execution Time', key: 'executionTime', width: 25 },
    { header: 'Duration (ms)', key: 'duration', width: 15 },
  ];
  styleHeader(detailSheet, 1);

  results.forEach((r, idx) => {
    const row = detailSheet.addRow({
      id: r.id || `TC-${String(idx + 1).padStart(4, '0')}`,
      suite: r.suite || '',
      category: r.category || '',
      name: r.name || '',
      description: r.description || '',
      preconditions: r.preconditions || '',
      steps: r.steps || '',
      expected: r.expected || '',
      actual: r.actual || '',
      status: r.status || 'UNKNOWN',
      severity: r.severity || 'MEDIUM',
      error: r.error || '',
      screenshot: r.screenshot || '',
      executionTime: r.executionTime || '',
      duration: r.duration || 0,
    });
    // Color status cell
    const statusCell = row.getCell('status');
    const color = STATUS_COLORS[r.status] || 'FF6C757D';
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    // Color severity cell
    const sevCell = row.getCell('severity');
    const sevColor = SEVERITY_COLORS[r.severity] || 'FFFFC107';
    sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sevColor } };
    sevCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 10 };
    sevCell.alignment = { horizontal: 'center', vertical: 'middle' };
    // Style all data cells
    row.eachCell((cell) => styleDataCell(cell));
    row.height = 25;
  });

  // Add auto-filter
  detailSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: detailSheet.columns.length },
  };

  // ── Sheet 3: Failure Analysis ────────────────────────────────────────────────
  const failSheet = workbook.addWorksheet('Failure Analysis');
  failSheet.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Test Name', key: 'name', width: 35 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Error Message', key: 'error', width: 60 },
    { header: 'Screenshot', key: 'screenshot', width: 30 },
    { header: 'Execution Time', key: 'executionTime', width: 25 },
  ];
  styleHeader(failSheet, 1);

  const failures = results.filter(r => r.status === 'FAIL' || r.status === 'BLOCKED');
  if (failures.length === 0) {
    failSheet.addRow({ id: 'N/A', category: 'N/A', name: 'No failures recorded', status: 'PASS', severity: 'N/A', error: '', screenshot: '', executionTime: '' });
  } else {
    failures.forEach(r => {
      const row = failSheet.addRow({
        id: r.id, category: r.category, name: r.name,
        status: r.status, severity: r.severity,
        error: r.error, screenshot: r.screenshot, executionTime: r.executionTime,
      });
      const statusCell = row.getCell('status');
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_COLORS[r.status] || 'FF6C757D' } };
      statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.eachCell((cell) => styleDataCell(cell));
    });
  }

  // ── Sheet 4: Environment ─────────────────────────────────────────────────────
  const envSheet = workbook.addWorksheet('Environment');
  envSheet.columns = [
    { header: 'Variable', key: 'variable', width: 35 },
    { header: 'Value', key: 'value', width: 60 },
  ];
  styleHeader(envSheet, 1);

  const envData = [
    ['WEB_BASE_URL', process.env.WEB_BASE_URL || 'http://localhost:3000'],
    ['API_BASE_URL', process.env.API_BASE_URL || 'http://localhost:8000/api/v1'],
    ['HEADLESS', process.env.HEADLESS || 'true'],
    ['BROWSER', process.env.BROWSER || 'chrome'],
    ['Node Version', process.version],
    ['Platform', process.platform],
    ['CI', process.env.CI || 'false'],
    ['GITHUB_RUN_ID', process.env.GITHUB_RUN_ID || 'local'],
    ['GITHUB_SHA', process.env.GITHUB_SHA || 'local'],
    ['Report Time', new Date().toISOString()],
  ];

  envData.forEach(([variable, value]) => {
    const row = envSheet.addRow({ variable, value: String(value) });
    row.eachCell((cell) => styleDataCell(cell));
  });

  // ── Save File ─────────────────────────────────────────────────────────────────
  if (!fs.existsSync(config.REPORT_DIR)) {
    fs.mkdirSync(config.REPORT_DIR, { recursive: true });
  }
  let filePath = path.join(config.REPORT_DIR, config.EXCEL_FILENAME);
  try {
    await workbook.xlsx.writeFile(filePath);
  } catch (err) {
    if (err.code === 'EBUSY') {
      filePath = path.join(config.REPORT_DIR, `Selenium-E2E-Test-Report-${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(filePath);
    } else {
      throw err;
    }
  }
  console.log(`\n📊 Excel report saved: ${filePath}`);
  console.log(`   Total: ${total} | PASS: ${pass} | FAIL: ${fail} | BLOCKED: ${blocked} | SKIPPED: ${skipped} | Pass%: ${passPercent}%`);

  return filePath;
}

module.exports = { generateExcelReport };
