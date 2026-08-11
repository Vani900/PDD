/**
 * CharityAI Appium — API Utility
 * Direct API calls for setup/verification in Appium tests.
 * Uses 10.0.2.2 (Android emulator loopback) for local dev.
 */
const axios = require('axios');
const config = require('../config/appium.config');

const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

async function checkApiHealth() {
  try {
    const baseUrl = config.API_BASE_URL.replace('/api/v1', '');
    const res = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    return { reachable: true, status: res.status, data: res.data };
  } catch (e) {
    return { reachable: false, error: e.message };
  }
}

async function apiLogin(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
}

module.exports = { apiClient, checkApiHealth, apiLogin };
