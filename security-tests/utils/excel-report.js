/**
 * CharityAI Security — Excel Report Generator
 */
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../config/security.config');

const STATUS_COLORS = { PASS: 'FF28A745', FAIL: 'FFDC3545', BLOCKED: 'FFFD7E14', SKIPPED: 'FF6C757D', WARN: 'FFFFC107' };
const RISK_COLORS = { CRITICAL: 'FFDC3545', HIGH: 'FFFD7E14', MEDIUM: 'FFFFC107', LOW: 'FF28A745', INFO: 'FF17A2B8' };

function styleHeader(ws, rowNum) {
  ws.getRow(rowNum).eachCell(c => {
    c.fill = { type:'pattern',pattern:'solid',fgColor:{argb:'FF1B2A41'} };
    c.font = { bold:true,color:{argb:'FFFFFFFF'},name:'Calibri',size:11 };
    c.alignment = { vertical:'middle',horizontal:'center',wrapText:true };
    c.border = { top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'} };
  });
  ws.getRow(rowNum).height = 32;
}
function styleCell(c) {
  c.alignment = { vertical:'top',wrapText:true };
  c.border = { top:{style:'thin',color:{argb:'FFD0D0D0'}},left:{style:'thin',color:{argb:'FFD0D0D0'}},bottom:{style:'thin',color:{argb:'FFD0D0D0'}},right:{style:'thin',color:{argb:'FFD0D0D0'}} };
}

async function generateExcelReport(results, metadata={}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CharityAI Security QA';
  wb.created = new Date();

  const pass = results.filter(r=>r.status==='PASS').length;
  const fail = results.filter(r=>r.status==='FAIL').length;
  const blocked = results.filter(r=>r.status==='BLOCKED').length;
  const warn = results.filter(r=>r.status==='WARN').length;
  const total = results.length;
  const passPercent = total > 0 ? ((pass/total)*100).toFixed(2) : '0.00';

  // Sheet 1: Executive Summary
  const s1 = wb.addWorksheet('Executive Summary');
  s1.columns = [{header:'Metric',key:'m',width:35},{header:'Value',key:'v',width:50}];
  styleHeader(s1, 1);
  [['Test Suite','CharityAI API Security & Penetration Testing'],['Total Tests',total],['Passed (Secure)',pass],['Failed (Vulnerable)',fail],['Warnings',warn],['Blocked',blocked],['Pass %',`${passPercent}%`],['Target API',config.API_BASE_URL],['Web Target',config.WEB_BASE_URL],['Test Date',new Date().toISOString()],['Duration',metadata.duration||''],['Tester','Automated Security Scanner']].forEach(([m,v])=>{ const row=s1.addRow({m,v:String(v)}); row.eachCell(c=>{styleCell(c);c.font={name:'Calibri',size:11};}); });

  // Sheet 2: All Test Results
  const s2 = wb.addWorksheet('Security Test Results');
  s2.columns = [{header:'Test ID',key:'id',width:18},{header:'Suite',key:'suite',width:25},{header:'Category',key:'category',width:20},{header:'Test Name',key:'name',width:40},{header:'Description',key:'description',width:50},{header:'Risk Level',key:'severity',width:12},{header:'OWASP Category',key:'owasp',width:20},{header:'Steps',key:'steps',width:50},{header:'Expected',key:'expected',width:40},{header:'Actual',key:'actual',width:40},{header:'Status',key:'status',width:12},{header:'Recommendation',key:'recommendation',width:50},{header:'Duration (ms)',key:'duration',width:15}];
  styleHeader(s2, 1);
  results.forEach(r => {
    const row = s2.addRow({id:r.id,suite:r.suite,category:r.category,name:r.name,description:r.description,severity:r.severity||'MEDIUM',owasp:r.owasp||'',steps:r.steps,expected:r.expected,actual:r.actual,status:r.status,recommendation:r.recommendation||'',duration:r.duration||0});
    const sc = row.getCell('status');
    sc.fill={type:'pattern',pattern:'solid',fgColor:{argb:STATUS_COLORS[r.status]||'FF6C757D'}};
    sc.font={bold:true,color:{argb:'FFFFFFFF'},name:'Calibri',size:10};
    sc.alignment={horizontal:'center',vertical:'middle'};
    const rc = row.getCell('severity');
    rc.fill={type:'pattern',pattern:'solid',fgColor:{argb:RISK_COLORS[r.severity]||'FF17A2B8'}};
    rc.font={bold:true,color:{argb:'FFFFFFFF'},name:'Calibri',size:10};
    rc.alignment={horizontal:'center',vertical:'middle'};
    row.eachCell(c=>styleCell(c));
    row.height=25;
  });
  s2.autoFilter={from:{row:1,column:1},to:{row:1,column:s2.columns.length}};

  // Sheet 3: Vulnerabilities (failures only)
  const s3 = wb.addWorksheet('Vulnerabilities');
  s3.columns = [{header:'Test ID',key:'id',width:18},{header:'Risk',key:'severity',width:12},{header:'Category',key:'category',width:20},{header:'Vulnerability',key:'name',width:40},{header:'Actual Result',key:'actual',width:50},{header:'Recommendation',key:'recommendation',width:60}];
  styleHeader(s3, 1);
  const vulns = results.filter(r=>r.status==='FAIL');
  if (vulns.length===0) s3.addRow({id:'N/A',severity:'N/A',category:'N/A',name:'No vulnerabilities found',actual:'All tests passed',recommendation:''});
  else vulns.forEach(r=>{ const row=s3.addRow({id:r.id,severity:r.severity,category:r.category,name:r.name,actual:r.actual,recommendation:r.recommendation||'Review and fix this security issue'}); row.getCell('severity').fill={type:'pattern',pattern:'solid',fgColor:{argb:RISK_COLORS[r.severity]||'FF6C757D'}}; row.getCell('severity').font={bold:true,color:{argb:'FFFFFFFF'}}; row.eachCell(c=>styleCell(c)); });

  // Sheet 4: Environment
  const s4 = wb.addWorksheet('Scan Environment');
  s4.columns=[{header:'Variable',key:'v',width:35},{header:'Value',key:'val',width:60}];
  styleHeader(s4,1);
  [['API_BASE_URL',config.API_BASE_URL],['WEB_BASE_URL',config.WEB_BASE_URL],['Node Version',process.version],['Platform',process.platform],['CI',process.env.CI||'false'],['GITHUB_RUN_ID',process.env.GITHUB_RUN_ID||'local'],['GITHUB_SHA',process.env.GITHUB_SHA||'local'],['Scan Time',new Date().toISOString()]].forEach(([v,val])=>{ const row=s4.addRow({v,val:String(val)}); row.eachCell(c=>styleCell(c)); });

  if (!fs.existsSync(config.REPORT_DIR)) fs.mkdirSync(config.REPORT_DIR,{recursive:true});
  const filePath = path.join(config.REPORT_DIR, config.EXCEL_FILENAME);
  await wb.xlsx.writeFile(filePath);
  console.log(`\n🔐 Security Excel report: ${filePath}`);
  console.log(`   Total: ${total} | PASS: ${pass} | FAIL: ${fail} | WARN: ${warn} | Pass%: ${passPercent}%`);
  return filePath;
}

module.exports = { generateExcelReport };
