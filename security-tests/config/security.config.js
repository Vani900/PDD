/**
 * CharityAI Security Test Configuration
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',
  WEB_BASE_URL: process.env.WEB_BASE_URL || 'http://localhost:3000',
  TEST_DONOR_EMAIL: process.env.TEST_DONOR_EMAIL || '',
  TEST_DONOR_PASSWORD: process.env.TEST_DONOR_PASSWORD || '',
  TEST_NGO_EMAIL: process.env.TEST_NGO_EMAIL || '',
  TEST_NGO_PASSWORD: process.env.TEST_NGO_PASSWORD || '',
  REQUEST_TIMEOUT: parseInt(process.env.SECURITY_REQUEST_TIMEOUT || '10000'),
  REPORT_DIR: process.env.REPORT_DIR || require('path').join(__dirname, '..', 'reports'),
  EXCEL_FILENAME: 'Security-Test-Report.xlsx',
};
