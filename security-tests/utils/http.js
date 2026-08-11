/**
 * CharityAI Security — Common HTTP Helper
 * Wraps axios with security-specific error handling.
 */
const axios = require('axios');
const config = require('../config/security.config');

const client = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.REQUEST_TIMEOUT,
  validateStatus: () => true, // Accept all status codes
  maxRedirects: 0,
});

async function checkApiReachable() {
  try {
    const baseUrl = config.API_BASE_URL.replace('/api/v1', '');
    const r = await axios.get(`${baseUrl}/health`, { timeout: 5000, validateStatus: () => true });
    return { reachable: true, status: r.status };
  } catch (e) {
    return { reachable: false, error: e.message };
  }
}

async function getAuthToken(email, password) {
  const r = await client.post('/auth/login', { email, password });
  if (r.status === 200 && r.data.access_token) return r.data.access_token;
  throw new Error(`Auth failed: ${r.status}`);
}

async function request(method, path, options = {}) {
  return client.request({ method, url: path, ...options });
}

module.exports = { client, checkApiReachable, getAuthToken, request };
