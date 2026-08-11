/**
 * CharityAI Selenium Browser Utility
 * Creates and manages WebDriver instances.
 */
const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/selenium.config');
const fs = require('fs');
const path = require('path');

/**
 * Build a ChromeDriver instance.
 * @returns {WebDriver}
 */
async function buildDriver() {
  const options = new chrome.Options();
  if (config.HEADLESS) {
    options.addArguments('--headless=new');
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--disable-extensions',
    '--disable-blink-features=AutomationControlled'
  );

  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    implicit: config.IMPLICIT_WAIT,
    pageLoad: config.PAGE_LOAD_TIMEOUT,
  });

  return driver;
}

/**
 * Navigate to a URL relative to WEB_BASE_URL.
 */
async function navigateTo(driver, relativePath = '') {
  const url = config.WEB_BASE_URL + relativePath;
  await driver.get(url);
}

/**
 * Wait for element to be visible.
 */
async function waitForElement(driver, locator, timeout = 10000) {
  return await driver.wait(until.elementLocated(locator), timeout);
}

/**
 * Safe click — waits for element clickable.
 */
async function safeClick(driver, locator, timeout = 10000) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsEnabled(el), timeout);
  await el.click();
  return el;
}

/**
 * Safe type — clears then types.
 */
async function safeType(driver, locator, text, timeout = 10000) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await el.clear();
  await el.sendKeys(text);
  return el;
}

/**
 * Get page title.
 */
async function getTitle(driver) {
  return await driver.getTitle();
}

/**
 * Get current URL.
 */
async function getCurrentUrl(driver) {
  return await driver.getCurrentUrl();
}

/**
 * Take a screenshot and save to file.
 */
async function takeScreenshot(driver, filename) {
  try {
    if (!fs.existsSync(config.SCREENSHOT_DIR)) {
      fs.mkdirSync(config.SCREENSHOT_DIR, { recursive: true });
    }
    const data = await driver.takeScreenshot();
    const filepath = path.join(config.SCREENSHOT_DIR, filename);
    fs.writeFileSync(filepath, data, 'base64');
    return filepath;
  } catch (e) {
    return null;
  }
}

/**
 * Quit driver safely.
 */
async function quitDriver(driver) {
  try {
    if (driver) await driver.quit();
  } catch (_) {}
}

/**
 * Check if a URL is reachable (for environment detection).
 */
async function checkUrlReachable(url, timeoutMs = 5000) {
  const http = require('http');
  const https = require('https');
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode < 600);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    setTimeout(() => { req.destroy(); resolve(false); }, timeoutMs);
  });
}

module.exports = {
  buildDriver,
  navigateTo,
  waitForElement,
  safeClick,
  safeType,
  getTitle,
  getCurrentUrl,
  takeScreenshot,
  quitDriver,
  checkUrlReachable,
  By,
  Key,
  until,
};
