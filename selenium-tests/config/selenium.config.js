/**
 * CharityAI Selenium Configuration
 * Reads all settings from environment variables — no hardcoded values.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = {
  // Web base URL — default for local dev, override in CI
  WEB_BASE_URL: process.env.WEB_BASE_URL || 'http://localhost:3000',

  // API base URL
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',

  // Test credentials — default test accounts seeded automatically if not set
  TEST_DONOR_EMAIL: process.env.TEST_DONOR_EMAIL || 'donor@example.com',
  TEST_DONOR_PASSWORD: process.env.TEST_DONOR_PASSWORD || 'DonorPass123!',
  TEST_NGO_EMAIL: process.env.TEST_NGO_EMAIL || 'ngo@example.com',
  TEST_NGO_PASSWORD: process.env.TEST_NGO_PASSWORD || 'NgoPass123!',

  // Browser settings
  HEADLESS: process.env.HEADLESS !== 'false', // default headless in CI
  BROWSER: process.env.BROWSER || 'chrome',
  IMPLICIT_WAIT: parseInt(process.env.IMPLICIT_WAIT || '5000'),
  PAGE_LOAD_TIMEOUT: parseInt(process.env.PAGE_LOAD_TIMEOUT || '30000'),
  SCREENSHOT_ON_FAIL: process.env.SCREENSHOT_ON_FAIL !== 'false',
  SCREENSHOT_DIR: process.env.SCREENSHOT_DIR || require('path').join(__dirname, '..', 'reports', 'screenshots'),

  // Report output
  REPORT_DIR: process.env.REPORT_DIR || require('path').join(__dirname, '..', 'reports'),
  EXCEL_FILENAME: 'Selenium-E2E-Test-Report.xlsx',
};

module.exports = config;
