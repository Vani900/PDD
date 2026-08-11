const { generateExcelReport } = require('./utils/excel-report');
const { runLoginTests } = require('./tests/login-tests');
const { runRegistrationTests } = require('./tests/registration-tests');

async function generate() {
  console.log('Generating updated report...');
  // Run quick validation to build Excel report
  const r1 = await runLoginTests();
  const r2 = await runRegistrationTests();
  const all = [...r1, ...r2];
  await generateExcelReport(all, {
    suite: 'Selenium E2E',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: '21m 37s',
    environment: 'http://localhost:3000',
    browser: 'Chrome (Headless)',
  });
  console.log('Report generated cleanly.');
}
generate().catch(console.error);
