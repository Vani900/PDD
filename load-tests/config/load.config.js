/**
 * CharityAI Load Testing Configuration
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',
  WEB_BASE_URL: process.env.WEB_BASE_URL || 'http://localhost:3000',
  TEST_DONOR_EMAIL: process.env.TEST_DONOR_EMAIL || '',
  TEST_DONOR_PASSWORD: process.env.TEST_DONOR_PASSWORD || '',
  TEST_NGO_EMAIL: process.env.TEST_NGO_EMAIL || '',
  TEST_NGO_PASSWORD: process.env.TEST_NGO_PASSWORD || '',
  REPORT_DIR: process.env.REPORT_DIR || require('path').join(__dirname, '..', 'reports'),
  EXCEL_FILENAME: 'Load-Test-Report.xlsx',

  // Performance SLA Thresholds
  SLA: {
    P95_RESPONSE_TIME_MS: parseInt(process.env.SLA_P95_MS || '500'),
    MAX_ERROR_RATE_PERCENT: parseFloat(process.env.SLA_MAX_ERROR_RATE || '1.0'),
    MIN_SUCCESSFUL_RPS: parseInt(process.env.SLA_MIN_RPS || '50'),
  },

  // Default Load Profile Settings
  LOAD_PROFILES: {
    smoke: { vus: 5, durationSec: 10, rampUpSec: 2 },
    load: { vus: 50, durationSec: 30, rampUpSec: 5 },
    stress: { vus: 150, durationSec: 30, rampUpSec: 10 },
    spike: { vus: 250, durationSec: 15, rampUpSec: 1 },
    soak: { vus: 30, durationSec: 60, rampUpSec: 5 },
  },
};
