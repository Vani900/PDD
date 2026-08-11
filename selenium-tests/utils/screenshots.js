/**
 * CharityAI Screenshots Utility
 */
const fs = require('fs');
const path = require('path');
const config = require('../config/selenium.config');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureScreenshot(driver, testId, label = 'failure') {
  if (!config.SCREENSHOT_ON_FAIL) return null;
  ensureDir(config.SCREENSHOT_DIR);
  try {
    const data = await driver.takeScreenshot();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testId}_${label}_${ts}.png`;
    const filepath = path.join(config.SCREENSHOT_DIR, filename);
    fs.writeFileSync(filepath, data, 'base64');
    return filepath;
  } catch (e) {
    return null;
  }
}

module.exports = { captureScreenshot };
