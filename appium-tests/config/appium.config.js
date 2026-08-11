/**
 * CharityAI Appium Configuration
 * All settings from environment variables — no hardcoded values.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = {
  APPIUM_SERVER_URL: process.env.APPIUM_SERVER_URL || 'http://localhost:4723',
  ANDROID_APP_PATH: process.env.ANDROID_APP_PATH || '',
  ANDROID_DEVICE_NAME: process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
  ANDROID_PLATFORM_VERSION: process.env.ANDROID_PLATFORM_VERSION || '13.0',
  ANDROID_PACKAGE: process.env.ANDROID_PACKAGE || 'com.charityai.app',
  ANDROID_ACTIVITY: process.env.ANDROID_ACTIVITY || '.MainActivity',
  API_BASE_URL: process.env.API_BASE_URL || 'http://10.0.2.2:8000/api/v1',
  TEST_DONOR_EMAIL: process.env.TEST_DONOR_EMAIL || '',
  TEST_DONOR_PASSWORD: process.env.TEST_DONOR_PASSWORD || '',
  TEST_NGO_EMAIL: process.env.TEST_NGO_EMAIL || '',
  TEST_NGO_PASSWORD: process.env.TEST_NGO_PASSWORD || '',
  IMPLICIT_WAIT: parseInt(process.env.APPIUM_IMPLICIT_WAIT || '5000'),
  COMMAND_TIMEOUT: parseInt(process.env.APPIUM_COMMAND_TIMEOUT || '120'),
  SCREENSHOT_ON_FAIL: process.env.SCREENSHOT_ON_FAIL !== 'false',
  SCREENSHOT_DIR: process.env.SCREENSHOT_DIR || require('path').join(__dirname, '..', 'reports', 'screenshots'),
  REPORT_DIR: process.env.REPORT_DIR || require('path').join(__dirname, '..', 'reports'),
  EXCEL_FILENAME: 'Appium-E2E-Test-Report.xlsx',
};

/**
 * Check if Android environment is available.
 * Returns detailed availability status.
 */
async function checkAndroidEnvironment() {
  const issues = [];
  if (!config.ANDROID_APP_PATH) issues.push('ANDROID_APP_PATH not set');
  if (!config.APPIUM_SERVER_URL) issues.push('APPIUM_SERVER_URL not set');
  
  // Try to reach Appium server
  try {
    const axios = require('axios');
    await axios.get(`${config.APPIUM_SERVER_URL}/status`, { timeout: 3000 });
  } catch (e) {
    issues.push(`Appium server not reachable at ${config.APPIUM_SERVER_URL}: ${e.message}`);
  }

  return {
    available: issues.length === 0,
    issues,
    reason: issues.join('; '),
  };
}

module.exports = { ...config, checkAndroidEnvironment };
