/**
 * CharityAI Appium Screenshots Utility
 */
const fs = require('fs');
const path = require('path');
const config = require('../config/appium.config');

async function captureScreenshot(driver, testId, label = 'failure') {
  if (!config.SCREENSHOT_ON_FAIL) return null;
  if (!fs.existsSync(config.SCREENSHOT_DIR)) fs.mkdirSync(config.SCREENSHOT_DIR, { recursive: true });
  try {
    const data = await driver.takeScreenshot();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `appium_${testId}_${label}_${ts}.png`;
    const filepath = path.join(config.SCREENSHOT_DIR, filename);
    fs.writeFileSync(filepath, data, 'base64');
    return filepath;
  } catch (_) { return null; }
}

module.exports = { captureScreenshot };
