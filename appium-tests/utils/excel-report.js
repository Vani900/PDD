/**
 * CharityAI Appium Excel Report Generator
 * Same structure as Selenium report but for mobile tests.
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../config/appium.config');

const STATUS_COLORS = { PASS: 'FF28A745', FAIL: 'FFDC3545', BLOCKED: 'FFFD7E14', SKIPPED: 'FF6C757D' };
const SEVERITY_COLORS = { CRITICAL: 'FFDC3545', HIGH: 'FFFD7E14', MEDIUM: 'FFFFC107', LOW: 'FF28A745' };

function styleHeader(ws, row) {
  ws.getRow(row).eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} };
  });
  ws.getRow(row).height = 30;
}

function styleCell(c) {
  c.alignment = { vertical: 'top', wrapText: true };
  c.border = { top:{style:'thin',color:{argb:'FFD0D0D0'}},left:{style:'thin',color:{argb:'FFD0D0D0'}},bottom:{style:'thin',color:{argb:'FFD0D0D0'}},right:{style:'thin',color:{argb:'FFD0D0D0'}} };
}

async function generateExcelReport(results, metadata = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CharityAI Appium QA';
  workbook.created = new Date();

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const blocked = results.filter(r => r.status === 'BLOCKED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const total = results.length;
  const passPercent = total > 0 ? ((pass / total) * 100).toFixed(2) : '0.00';

  // Sheet 1: Summary
  const s1 = workbook.addWorksheet('Summary');
  s1.columns = [{ header: 'Metric', key: 'metric', width: 30 }, { header: 'Value', key: 'value', width: 40 }];
  styleHeader(s1, 1);
  [['Total Tests', total], ['Passed', pass], ['Failed', fail], ['Blocked', blocked], ['Skipped', skipped],
   ['Pass %', `${passPercent}%`], ['Platform', 'Android'], ['Automation', 'Appium + WebdriverIO'],
   ['Device', metadata.device || config.ANDROID_DEVICE_NAME], ['App Path', metadata.appPath || config.ANDROID_APP_PATH || 'N/A'],
   ['Start Time', metadata.startTime || ''], ['End Time', metadata.endTime || ''], ['Duration', metadata.duration || ''],
   ['Report Generated', new Date().toISOString()]].forEach(([m,v]) => {
    const row = s1.addRow({metric: m, value: String(v)});
    row.eachCell(c => { styleCell(c); c.font = { name: 'Calibri', size: 11 }; });
  });

  // Sheet 2: Test Details
  const s2 = workbook.addWorksheet('Test Details');
  s2.columns = [
    {header:'Test ID',key:'id',width:20},{header:'Suite',key:'suite',width:22},{header:'Category',key:'category',width:20},
    {header:'Test Name',key:'name',width:35},{header:'Description',key:'description',width:40},
    {header:'Preconditions',key:'preconditions',width:30},{header:'Steps',key:'steps',width:50},
    {header:'Expected',key:'expected',width:35},{header:'Actual',key:'actual',width:35},
    {header:'Status',key:'status',width:12},{header:'Severity',key:'severity',width:12},
    {header:'Error',key:'error',width:40},{header:'Screenshot',key:'screenshot',width:30},
    {header:'Execution Time',key:'executionTime',width:25},{header:'Duration (ms)',key:'duration',width:15},
  ];
  styleHeader(s2, 1);
  results.forEach((r, i) => {
    const row = s2.addRow({ id: r.id || `APM-${String(i+1).padStart(4,'0')}`, suite: r.suite||'', category: r.category||'', name: r.name||'', description: r.description||'', preconditions: r.preconditions||'', steps: r.steps||'', expected: r.expected||'', actual: r.actual||'', status: r.status||'', severity: r.severity||'MEDIUM', error: r.error||'', screenshot: r.screenshot||'', executionTime: r.executionTime||'', duration: r.duration||0 });
    const sc = row.getCell('status');
    sc.fill = { type:'pattern',pattern:'solid',fgColor:{argb: STATUS_COLORS[r.status]||'FF6C757D'} };
    sc.font = { bold:true,color:{argb:'FFFFFFFF'},name:'Calibri',size:10 };
    sc.alignment = { horizontal:'center',vertical:'middle' };
    row.eachCell(c => styleCell(c));
    row.height = 25;
  });
  s2.autoFilter = { from:{row:1,column:1}, to:{row:1,column:s2.columns.length} };

  // Sheet 3: Failure Analysis
  const s3 = workbook.addWorksheet('Failure Analysis');
  s3.columns = [{header:'Test ID',key:'id',width:20},{header:'Category',key:'category',width:20},{header:'Test Name',key:'name',width:35},{header:'Status',key:'status',width:12},{header:'Severity',key:'severity',width:12},{header:'Error',key:'error',width:60},{header:'Execution Time',key:'executionTime',width:25}];
  styleHeader(s3, 1);
  const fails = results.filter(r => r.status === 'FAIL' || r.status === 'BLOCKED');
  if (fails.length === 0) { s3.addRow({id:'N/A',category:'N/A',name:'No failures',status:'N/A',severity:'N/A',error:'',executionTime:''}); }
  else { fails.forEach(r => { const row = s3.addRow({id:r.id,category:r.category,name:r.name,status:r.status,severity:r.severity,error:r.error,executionTime:r.executionTime}); row.getCell('status').fill={type:'pattern',pattern:'solid',fgColor:{argb:STATUS_COLORS[r.status]||'FF6C757D'}}; row.getCell('status').font={bold:true,color:{argb:'FFFFFFFF'}}; row.eachCell(c=>styleCell(c)); }); }

  // Sheet 4: Environment
  const s4 = workbook.addWorksheet('Environment');
  s4.columns = [{header:'Variable',key:'variable',width:35},{header:'Value',key:'value',width:60}];
  styleHeader(s4, 1);
  [['APPIUM_SERVER_URL',config.APPIUM_SERVER_URL],['ANDROID_DEVICE_NAME',config.ANDROID_DEVICE_NAME],['ANDROID_PLATFORM_VERSION',config.ANDROID_PLATFORM_VERSION],['ANDROID_APP_PATH',config.ANDROID_APP_PATH||'Not set'],['API_BASE_URL',config.API_BASE_URL],['Node Version',process.version],['Platform',process.platform],['CI',process.env.CI||'false'],['GITHUB_RUN_ID',process.env.GITHUB_RUN_ID||'local']].forEach(([v,val]) => { const row = s4.addRow({variable:v,value:String(val)}); row.eachCell(c=>styleCell(c)); });

  if (!fs.existsSync(config.REPORT_DIR)) fs.mkdirSync(config.REPORT_DIR, {recursive:true});
  const filePath = path.join(config.REPORT_DIR, config.EXCEL_FILENAME);
  await workbook.xlsx.writeFile(filePath);
  console.log(`\n📊 Appium Excel report: ${filePath}`);
  console.log(`   Total: ${total} | PASS: ${pass} | FAIL: ${fail} | BLOCKED: ${blocked} | Pass%: ${passPercent}%`);
  return filePath;
}

module.exports = { generateExcelReport };
