/**
 * CharityAI Load Testing Engine
 * Pure Node.js async load generator supporting smoke, load, stress, spike, soak profiles.
 * Measures response times (P50, P90, P95, P99), RPS, error rates, and validates SLAs.
 */
const axios = require('axios');
const config = require('../config/load.config');

function calculatePercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runLoadScenario(scenarioName = 'smoke', customProfile = null) {
  const profile = customProfile || config.LOAD_PROFILES[scenarioName] || config.LOAD_PROFILES.smoke;
  const { vus, durationSec, rampUpSec } = profile;

  console.log(`\n⚡ Starting Load Test Scenario: [${scenarioName.toUpperCase()}]`);
  console.log(`   VUs: ${vus} | Duration: ${durationSec}s | Ramp-Up: ${rampUpSec}s | Target: ${config.API_BASE_URL}`);

  const endpoints = [
    { name: 'GET /health', method: 'GET', path: '/health', weight: 20 },
    { name: 'GET /donations', method: 'GET', path: '/donations?page=1&page_size=10', weight: 40 },
    { name: 'GET /ngos', method: 'GET', path: '/ngos?page=1&page_size=10', weight: 25 },
    { name: 'GET /ngo-requirements', method: 'GET', path: '/ngo-requirements?page=1&page_size=10', weight: 15 },
  ];

  const client = axios.create({ baseURL: config.API_BASE_URL.replace('/api/v1', '') });

  // Store metrics per endpoint
  const endpointMetrics = {};
  endpoints.forEach(e => {
    endpointMetrics[e.name] = { name: e.name, method: e.method, latencies: [], successes: 0, failures: 0 };
  });

  const startTime = Date.now();
  const endTime = startTime + durationSec * 1000;
  let totalRequests = 0;

  // Worker task for a single Virtual User (VU)
  async function runVU(vuId) {
    while (Date.now() < endTime) {
      // Pick random endpoint weighted
      const rand = Math.random() * 100;
      let cum = 0;
      let target = endpoints[0];
      for (const ep of endpoints) {
        cum += ep.weight;
        if (rand <= cum) { target = ep; break; }
      }

      const t0 = Date.now();
      try {
        const fullPath = target.path.startsWith('/health') ? '/health' : `/api/v1${target.path}`;
        const res = await client.request({ method: target.method, url: fullPath, timeout: 5000, validateStatus: () => true });
        const latency = Date.now() - t0;
        totalRequests++;
        const metrics = endpointMetrics[target.name];
        metrics.latencies.push(latency);
        if (res.status >= 200 && res.status < 400) metrics.successes++;
        else metrics.failures++;
      } catch (e) {
        const latency = Date.now() - t0;
        totalRequests++;
        const metrics = endpointMetrics[target.name];
        metrics.latencies.push(latency);
        metrics.failures++;
      }

      // Small pacing delay between requests (50-200ms)
      await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
    }
  }

  // Ramp-up VUs
  const vuPromises = [];
  const delayPerVU = (rampUpSec * 1000) / vus;
  for (let i = 0; i < vus; i++) {
    vuPromises.push(runVU(i + 1));
    if (delayPerVU > 0) await new Promise(r => setTimeout(r, delayPerVU));
  }

  await Promise.all(vuPromises);

  const totalDurationSec = (Date.now() - startTime) / 1000;
  const allLatencies = Object.values(endpointMetrics).flatMap(m => m.latencies);
  const totalSuccesses = Object.values(endpointMetrics).reduce((s, m) => s + m.successes, 0);
  const totalFailures = Object.values(endpointMetrics).reduce((s, m) => s + m.failures, 0);

  const avgMs = allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0;
  const p50Ms = calculatePercentile(allLatencies, 50);
  const p90Ms = calculatePercentile(allLatencies, 90);
  const p95Ms = calculatePercentile(allLatencies, 95);
  const p99Ms = calculatePercentile(allLatencies, 99);
  const minMs = allLatencies.length > 0 ? Math.min(...allLatencies) : 0;
  const maxMs = allLatencies.length > 0 ? Math.max(...allLatencies) : 0;
  const rps = totalDurationSec > 0 ? totalRequests / totalDurationSec : 0;
  const errorRate = totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0;

  const slaPassed = p95Ms <= config.SLA.P95_RESPONSE_TIME_MS && errorRate <= config.SLA.MAX_ERROR_RATE_PERCENT;

  const scenarioStats = {
    totalRequests,
    successRequests: totalSuccesses,
    failedRequests: totalFailures,
    errorRate,
    rps,
    minMs,
    avgMs,
    p50Ms,
    p90Ms,
    p95Ms,
    p99Ms,
    maxMs,
    durationSec: totalDurationSec,
    slaPassed,
  };

  // Compile per-endpoint summary rows
  const endpointRows = Object.values(endpointMetrics).map(m => {
    const epAvg = m.latencies.length > 0 ? m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length : 0;
    const epP95 = calculatePercentile(m.latencies, 95);
    const epErrorRate = m.latencies.length > 0 ? (m.failures / m.latencies.length) * 100 : 0;
    const epPassed = epP95 <= config.SLA.P95_RESPONSE_TIME_MS && epErrorRate <= config.SLA.MAX_ERROR_RATE_PERCENT;
    return {
      endpoint: m.name,
      method: m.method,
      requests: m.latencies.length,
      successes: m.successes,
      failures: m.failures,
      errorRate: epErrorRate,
      minMs: m.latencies.length > 0 ? Math.min(...m.latencies) : 0,
      avgMs: epAvg,
      p95Ms: epP95,
      maxMs: m.latencies.length > 0 ? Math.max(...m.latencies) : 0,
      status: epPassed ? 'PASS' : 'FAIL',
    };
  });

  console.log(`\n📊 [${scenarioName.toUpperCase()}] Results Summary:`);
  console.log(`   Requests: ${totalRequests} | RPS: ${rps.toFixed(1)} | Errors: ${errorRate.toFixed(2)}%`);
  console.log(`   Latency: Avg=${avgMs.toFixed(1)}ms | P95=${p95Ms}ms | P99=${p99Ms}ms | Max=${maxMs}ms`);
  console.log(`   SLA Status: ${slaPassed ? '✅ PASS' : '❌ FAIL (P95 > ' + config.SLA.P95_RESPONSE_TIME_MS + 'ms or Error Rate > ' + config.SLA.MAX_ERROR_RATE_PERCENT + '%)'}`);

  return { scenarioStats, endpointRows };
}

module.exports = { runLoadScenario };
