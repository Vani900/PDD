/**
 * CharityAI API Utility for Selenium Tests
 * Makes direct API calls for test setup/teardown and verification.
 */
const axios = require('axios');
const config = require('../config/selenium.config');

const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Check if the backend API is reachable.
 */
async function checkApiHealth() {
  try {
    const baseUrl = config.API_BASE_URL.replace('/api/v1', '');
    const res = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    return { reachable: true, status: res.status, data: res.data };
  } catch (e) {
    return { reachable: false, error: e.message };
  }
}

/**
 * Login via API and return tokens.
 */
async function apiLogin(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
}

/**
 * Register a user via API.
 */
async function apiRegister(payload) {
  const res = await apiClient.post('/auth/register', payload);
  return res.data;
}

/**
 * Ensure default donor and NGO test users exist in backend.
 * Called automatically at start of master test runner.
 */
async function ensureTestUsersExist() {
  const health = await checkApiHealth();
  if (!health.reachable) return false;

  // 1. Ensure Donor User
  try {
    await apiLogin(config.TEST_DONOR_EMAIL, config.TEST_DONOR_PASSWORD);
  } catch (_) {
    try {
      await apiRegister({
        first_name: 'Test',
        last_name: 'Donor',
        email: config.TEST_DONOR_EMAIL,
        password: config.TEST_DONOR_PASSWORD,
        role: 'donor',
      });
    } catch (_) {}
  }

  // 2. Ensure NGO User
  try {
    await apiLogin(config.TEST_NGO_EMAIL, config.TEST_NGO_PASSWORD);
  } catch (_) {
    try {
      await apiRegister({
        first_name: 'Test',
        last_name: 'NGO',
        email: config.TEST_NGO_EMAIL,
        password: config.TEST_NGO_PASSWORD,
        role: 'ngo_admin',
      });
    } catch (_) {}
  }

  return true;
}

/**
 * Get donations list.
 */
async function getDonations(token, params = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await apiClient.get('/donations', { headers, params });
  return res.data;
}

/**
 * Get NGO list.
 */
async function getNGOs(token, params = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await apiClient.get('/ngos', { headers, params });
  return res.data;
}

/**
 * Get NGO requirements.
 */
async function getNGORequirements(token, params = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await apiClient.get('/ngo-requirements', { headers, params });
  return res.data;
}

module.exports = {
  apiClient,
  checkApiHealth,
  apiLogin,
  apiRegister,
  ensureTestUsersExist,
  getDonations,
  getNGOs,
  getNGORequirements,
};
