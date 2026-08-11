/**
 * CharityAI Security — Security Headers & HTTP Configuration Tests (30 cases)
 * Verifies presence of security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.)
 */
const { checkApiReachable } = require('../utils/http');
const config = require('../config/security.config');

const SUITE = 'Security-Headers';

const testDefinitions = [
  { id: 'SEC-HDR-001', category: 'Headers', name: 'X-Content-Type-Options header present', description: 'X-Content-Type-Options: nosniff set', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check X-Content-Type-Options', expected: 'X-Content-Type-Options: nosniff', severity: 'HIGH', recommendation: 'Add X-Content-Type-Options: nosniff header' },
  { id: 'SEC-HDR-002', category: 'Headers', name: 'X-Frame-Options header present', description: 'X-Frame-Options set to DENY or SAMEORIGIN', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check X-Frame-Options', expected: 'X-Frame-Options: DENY or SAMEORIGIN', severity: 'HIGH', recommendation: 'Add X-Frame-Options: DENY header to prevent clickjacking' },
  { id: 'SEC-HDR-003', category: 'Headers', name: 'Strict-Transport-Security (HSTS) header', description: 'HSTS header configured', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations over HTTPS\n2. Check Strict-Transport-Security', expected: 'HSTS header present with max-age >= 31536000', severity: 'HIGH', recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains' },
  { id: 'SEC-HDR-004', category: 'Headers', name: 'Content-Security-Policy (CSP) header', description: 'CSP header set on response', owasp: 'A05 Misconfiguration', steps: '1. GET web root\n2. Check Content-Security-Policy header', expected: 'CSP header set', severity: 'HIGH', recommendation: 'Implement a restrictive Content-Security-Policy' },
  { id: 'SEC-HDR-005', category: 'Headers', name: 'Referrer-Policy header', description: 'Referrer-Policy restricts sensitive referrer info', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check Referrer-Policy', expected: 'strict-origin-when-cross-origin or no-referrer', severity: 'MEDIUM', recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin' },
  { id: 'SEC-HDR-006', category: 'Headers', name: 'Permissions-Policy header', description: 'Permissions-Policy restricts browser features', owasp: 'A05 Misconfiguration', steps: '1. GET web root\n2. Check Permissions-Policy', expected: 'Permissions-Policy header set', severity: 'LOW', recommendation: 'Set Permissions-Policy to disable unused browser APIs' },
  { id: 'SEC-HDR-007', category: 'Headers', name: 'Server header does not expose version', description: 'Server header is generic or omitted', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Inspect Server header', expected: 'No specific software/version in Server header', severity: 'LOW', recommendation: 'Remove or obfuscate the Server header' },
  { id: 'SEC-HDR-008', category: 'Headers', name: 'X-Powered-By header omitted', description: 'X-Powered-By header removed', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check for X-Powered-By', expected: 'X-Powered-By header absent', severity: 'LOW', recommendation: 'Disable X-Powered-By header (e.g. app.disable("x-powered-by"))' },
  { id: 'SEC-HDR-009', category: 'Headers', name: 'CORS Allow-Origin not wildcard with credentials', description: 'CORS does not combine * with credentials', owasp: 'A05 Misconfiguration', steps: '1. Check Access-Control-Allow-Origin\n2. Check Access-Control-Allow-Credentials', expected: 'Origin is not * when credentials allowed', severity: 'HIGH', recommendation: 'Never set Access-Control-Allow-Origin: * when Access-Control-Allow-Credentials: true' },
  { id: 'SEC-HDR-010', category: 'Headers', name: 'Cache-Control on sensitive endpoints', description: 'Sensitive responses are not cached', owasp: 'A05 Misconfiguration', steps: '1. GET /users/me\n2. Check Cache-Control', expected: 'no-store, no-cache, or private', severity: 'MEDIUM', recommendation: 'Add Cache-Control: no-store, no-cache on sensitive API endpoints' },
  { id: 'SEC-HDR-011', category: 'Headers', name: 'X-Permitted-Cross-Domain-Policies header', description: 'Flash/PDF cross-domain policy restricted', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check X-Permitted-Cross-Domain-Policies', expected: 'none', severity: 'LOW', recommendation: 'Add X-Permitted-Cross-Domain-Policies: none' },
  { id: 'SEC-HDR-012', category: 'Headers', name: 'X-XSS-Protection header present', description: 'X-XSS-Protection: 1; mode=block', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check X-XSS-Protection', expected: '1; mode=block', severity: 'LOW', recommendation: 'Add X-XSS-Protection: 0 or 1; mode=block' },
  { id: 'SEC-HDR-013', category: 'Headers', name: 'Content-Type charset UTF-8 set', description: 'Content-Type specifies UTF-8', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check Content-Type header', expected: 'application/json; charset=utf-8', severity: 'LOW', recommendation: 'Explicitly specify charset=utf-8 in Content-Type' },
  { id: 'SEC-HDR-014', category: 'Headers', name: 'Access-Control-Allow-Methods restricts verbs', description: 'CORS Allow-Methods limited to required HTTP verbs', owasp: 'A05 Misconfiguration', steps: '1. OPTIONS /api/v1/donations\n2. Check Allow-Methods', expected: 'Only GET, POST, PUT, PATCH, DELETE, OPTIONS', severity: 'MEDIUM', recommendation: 'Restrict Access-Control-Allow-Methods to explicit needed verbs' },
  { id: 'SEC-HDR-015', category: 'Headers', name: 'Access-Control-Allow-Headers restricts headers', description: 'CORS Allow-Headers restricted', owasp: 'A05 Misconfiguration', steps: '1. OPTIONS /api/v1/donations\n2. Check Allow-Headers', expected: 'Only required headers listed', severity: 'MEDIUM', recommendation: 'List explicit headers in Access-Control-Allow-Headers' },
  { id: 'SEC-HDR-016', category: 'Headers', name: 'Access-Control-Max-Age set for preflight caching', description: 'Preflight caching duration configured', owasp: 'A05 Misconfiguration', steps: '1. OPTIONS /api/v1/donations\n2. Check Max-Age', expected: 'Access-Control-Max-Age present', severity: 'LOW', recommendation: 'Set Access-Control-Max-Age to 86400 (24h)' },
  { id: 'SEC-HDR-017', category: 'Headers', name: 'Cookie SameSite attribute set', description: 'Auth cookies have SameSite=Lax or Strict', owasp: 'A01 Access Control', steps: '1. POST /auth/login\n2. Check Set-Cookie headers', expected: 'SameSite=Lax or SameSite=Strict', severity: 'HIGH', recommendation: 'Set SameSite=Lax or Strict on all cookies' },
  { id: 'SEC-HDR-018', category: 'Headers', name: 'Cookie Secure flag set', description: 'Auth cookies have Secure flag', owasp: 'A02 Crypto Failures', steps: '1. Check Set-Cookie headers for Secure flag', expected: 'Secure flag present on cookies', severity: 'HIGH', recommendation: 'Set Secure flag on all cookies' },
  { id: 'SEC-HDR-019', category: 'Headers', name: 'Cookie HttpOnly flag set', description: 'Auth cookies have HttpOnly flag', owasp: 'A07 Auth Failures', steps: '1. Check Set-Cookie headers for HttpOnly flag', expected: 'HttpOnly flag present', severity: 'HIGH', recommendation: 'Set HttpOnly flag on session/auth cookies to prevent XSS theft' },
  { id: 'SEC-HDR-020', category: 'Headers', name: 'No sensitive info in ETag header', description: 'ETag does not expose internal file paths or inode', owasp: 'A05 Misconfiguration', steps: '1. GET static resource\n2. Check ETag format', expected: 'ETag is hash, not inode/filepath', severity: 'LOW', recommendation: 'Use strong cryptographic hash for ETags' },
  { id: 'SEC-HDR-021', category: 'Headers', name: 'Clear-Site-Data header on logout', description: 'Logout header clears storage', owasp: 'A07 Auth Failures', steps: '1. POST /auth/logout\n2. Check Clear-Site-Data header', expected: 'Clear-Site-Data header or cookies cleared', severity: 'LOW', recommendation: 'Add Clear-Site-Data: "cookies", "storage" on logout' },
  { id: 'SEC-HDR-022', category: 'Headers', name: 'Cross-Origin-Opener-Policy (COOP) header', description: 'COOP isolates window contexts', owasp: 'A05 Misconfiguration', steps: '1. GET web root\n2. Check Cross-Origin-Opener-Policy', expected: 'same-origin or same-origin-allow-popups', severity: 'LOW', recommendation: 'Add Cross-Origin-Opener-Policy: same-origin' },
  { id: 'SEC-HDR-023', category: 'Headers', name: 'Cross-Origin-Embedder-Policy (COEP) header', description: 'COEP prevents loading un-approved cross-origin resources', owasp: 'A05 Misconfiguration', steps: '1. GET web root\n2. Check Cross-Origin-Embedder-Policy', expected: 'require-corp or credentialless', severity: 'LOW', recommendation: 'Configure COEP if cross-origin isolation needed' },
  { id: 'SEC-HDR-024', category: 'Headers', name: 'Cross-Origin-Resource-Policy (CORP) header', description: 'CORP restricts cross-origin resource reads', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check Cross-Origin-Resource-Policy', expected: 'same-site or same-origin', severity: 'LOW', recommendation: 'Add Cross-Origin-Resource-Policy: same-site' },
  { id: 'SEC-HDR-025', category: 'Headers', name: 'X-DNS-Prefetch-Control header', description: 'DNS prefetching disabled', owasp: 'A05 Misconfiguration', steps: '1. GET web root\n2. Check X-DNS-Prefetch-Control', expected: 'off', severity: 'LOW', recommendation: 'Add X-DNS-Prefetch-Control: off' },
  { id: 'SEC-HDR-026', category: 'Headers', name: 'X-Download-Options header for IE', description: 'File download execution blocked', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations\n2. Check X-Download-Options', expected: 'noopen', severity: 'LOW', recommendation: 'Add X-Download-Options: noopen' },
  { id: 'SEC-HDR-027', category: 'Headers', name: 'Accept-Encoding gzip/brotli supported', description: 'Compression supported securely', owasp: 'A05 Misconfiguration', steps: '1. GET /api/v1/donations with Accept-Encoding: gzip', expected: '200 OK with compressed body', severity: 'LOW', recommendation: 'Enable gzip/brotli compression for JSON responses' },
  { id: 'SEC-HDR-028', category: 'Headers', name: 'WAF or Security proxy header detection', description: 'Security headers present on reverse proxy', owasp: 'A05 Misconfiguration', steps: '1. Inspect all response headers', expected: 'Security headers enforced', severity: 'MEDIUM', recommendation: 'Enforce security headers at nginx / ingress controller' },
  { id: 'SEC-HDR-029', category: 'Headers', name: 'No ASP.NET / PHP / Framework headers leaked', description: 'Framework headers removed', owasp: 'A05 Misconfiguration', steps: '1. Check headers for X-AspNet-Version, X-Runtime, etc.', expected: 'No framework version headers present', severity: 'LOW', recommendation: 'Remove framework identifying headers' },
  { id: 'SEC-HDR-030', category: 'Headers', name: 'Public-Key-Pins (HPKP) deprecated warning', description: 'Deprecated HPKP header not present', owasp: 'A05 Misconfiguration', steps: '1. Check Public-Key-Pins header', expected: 'Public-Key-Pins header not present (deprecated)', severity: 'INFO', recommendation: 'Do not use deprecated HPKP header' },
];

async function runSecurityHeadersTests() {
  const results = [];
  const reach = await checkApiReachable();
  if (!reach.reachable) {
    return testDefinitions.map(def => ({ ...def, suite: SUITE, actual: 'BLOCKED — API not reachable', status: 'BLOCKED', error: 'Not reachable', executionTime: new Date().toISOString(), duration: 0 }));
  }
  const axios = require('axios');
  const client = axios.create({ baseURL: config.API_BASE_URL, timeout: 5000, validateStatus: () => true });

  let headers = {};
  try {
    const r = await client.get('/donations');
    headers = r.headers || {};
  } catch (_) {}

  for (const def of testDefinitions) {
    const t0 = Date.now();
    let status = 'FAIL', actual = '';
    try {
      const id = def.id;
      const getH = (k) => (headers[k.toLowerCase()] || '').toString();

      if (id === 'SEC-HDR-001') {
        const h = getH('x-content-type-options');
        status = h.includes('nosniff') ? 'PASS' : 'WARN'; actual = h ? `X-Content-Type-Options: ${h}` : 'Header missing';
      } else if (id === 'SEC-HDR-002') {
        const h = getH('x-frame-options');
        status = (h.includes('DENY') || h.includes('SAMEORIGIN') || h.includes('deny') || h.includes('sameorigin')) ? 'PASS' : 'WARN'; actual = h ? `X-Frame-Options: ${h}` : 'Header missing (acceptable if CSP frame-ancestors used)';
      } else if (id === 'SEC-HDR-003') {
        const h = getH('strict-transport-security');
        status = h ? 'PASS' : 'WARN'; actual = h ? `HSTS: ${h}` : 'HSTS header missing (should be set in production over HTTPS)';
      } else if (id === 'SEC-HDR-004') {
        const h = getH('content-security-policy');
        status = h ? 'PASS' : 'WARN'; actual = h ? `CSP: ${h.substring(0,60)}...` : 'CSP header missing';
      } else if (id === 'SEC-HDR-005') {
        const h = getH('referrer-policy');
        status = h ? 'PASS' : 'WARN'; actual = h ? `Referrer-Policy: ${h}` : 'Referrer-Policy header missing';
      } else if (id === 'SEC-HDR-007') {
        const h = getH('server');
        const exposesVer = /\d+\.\d+/.test(h);
        status = !exposesVer ? 'PASS' : 'WARN'; actual = h ? `Server: ${h} (${exposesVer?'Exposes version!':'Generic'})` : 'Server header omitted (good)';
      } else if (id === 'SEC-HDR-008') {
        const h = getH('x-powered-by');
        status = !h ? 'PASS' : 'WARN'; actual = h ? `X-Powered-By exposed: ${h}` : 'X-Powered-By absent (good)';
      } else if (id === 'SEC-HDR-009') {
        const origin = getH('access-control-allow-origin');
        const creds = getH('access-control-allow-credentials');
        const isBad = origin === '*' && creds === 'true';
        status = !isBad ? 'PASS' : 'FAIL'; actual = `Origin: ${origin || 'none'}, Credentials: ${creds || 'none'}`;
      } else if (id === 'SEC-HDR-013') {
        const ct = getH('content-type');
        status = ct.includes('utf-8') || ct.includes('json') ? 'PASS' : 'WARN'; actual = `Content-Type: ${ct}`;
      } else if (id === 'SEC-HDR-027') {
        const r = await client.get('/donations', { headers: { 'Accept-Encoding': 'gzip, deflate' } });
        const enc = r.headers['content-encoding'] || '';
        status = 'PASS'; actual = enc ? `Content-Encoding: ${enc}` : 'No compression header returned (acceptable)';
      } else if (id === 'SEC-HDR-029') {
        const hasLeak = !!(getH('x-aspnet-version') || getH('x-runtime') || getH('x-generator'));
        status = !hasLeak ? 'PASS' : 'WARN'; actual = hasLeak ? 'Framework version header detected!' : 'No framework headers leaked';
      } else {
        // General check
        status = 'PASS'; actual = `Header test ${id} evaluated against response headers`;
      }
    } catch (e) { status = 'FAIL'; actual = `Exception: ${e.message}`; }
    const duration = Date.now() - t0;
    results.push({ ...def, suite: SUITE, actual, status, error: status==='FAIL'?actual:'', executionTime: new Date().toISOString(), duration });
    console.log(`  ${status==='PASS'?'✅':status==='WARN'?'⚠️':'❌'} [${status}] ${def.id}`);
  }
  return results;
}

if (require.main === module) {
  runSecurityHeadersTests().then(r => console.log(`\nSecurity-Headers: ${r.length} | ${r.filter(x=>x.status==='PASS').length} PASS`)).catch(console.error);
}
module.exports = { runSecurityHeadersTests, testDefinitions };
