/**
 * CharityAI Appium Driver Utility
 * Creates WebdriverIO Appium client with Android capabilities.
 * Returns null if environment unavailable — never throws masked errors.
 */
const config = require('../config/appium.config');

async function buildDriver() {
  const { remote } = await import('webdriverio');
  
  const capabilities = {
    platformName: 'Android',
    'appium:deviceName': config.ANDROID_DEVICE_NAME,
    'appium:platformVersion': config.ANDROID_PLATFORM_VERSION,
    'appium:automationName': 'UiAutomator2',
    'appium:noReset': false,
    'appium:fullReset': false,
  };

  if (config.ANDROID_APP_PATH) {
    capabilities['appium:app'] = config.ANDROID_APP_PATH;
  } else if (config.ANDROID_PACKAGE) {
    capabilities['appium:appPackage'] = config.ANDROID_PACKAGE;
    capabilities['appium:appActivity'] = config.ANDROID_ACTIVITY;
  }

  const driver = await remote({
    protocol: 'http',
    hostname: new URL(config.APPIUM_SERVER_URL).hostname,
    port: parseInt(new URL(config.APPIUM_SERVER_URL).port) || 4723,
    path: '/wd/hub',
    capabilities,
    connectionRetryCount: 2,
    connectionRetryTimeout: 30000,
  });

  await driver.setImplicitTimeout(config.IMPLICIT_WAIT);
  return driver;
}

async function quitDriver(driver) {
  try { if (driver) await driver.deleteSession(); } catch (_) {}
}

async function takeScreenshot(driver, filename) {
  const fs = require('fs');
  const path = require('path');
  try {
    if (!fs.existsSync(config.SCREENSHOT_DIR)) fs.mkdirSync(config.SCREENSHOT_DIR, { recursive: true });
    const data = await driver.takeScreenshot();
    const filepath = path.join(config.SCREENSHOT_DIR, filename);
    fs.writeFileSync(filepath, data, 'base64');
    return filepath;
  } catch (_) { return null; }
}

module.exports = { buildDriver, quitDriver, takeScreenshot };
