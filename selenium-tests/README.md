# CharityAI Selenium E2E Tests

## Overview
300+ real Selenium WebDriver test cases for the CharityAI web application.

## Requirements
- Node.js >= 18
- Google Chrome + ChromeDriver (matching version)
- Backend running (for API tests)
- Web frontend running (for UI tests)

## Setup
```bash
npm install
```

## Running Tests
```bash
# Run all tests (generates Excel report)
npm test

# Run individual suite
npm run test:login
npm run test:dashboard
npm run test:donation
# etc.
```

## Environment Variables
```bash
WEB_BASE_URL=http://localhost:3000     # Web frontend URL
API_BASE_URL=http://localhost:8000/api/v1  # Backend API URL
TEST_DONOR_EMAIL=donor@example.com     # Test donor account
TEST_DONOR_PASSWORD=password           # Test donor password
TEST_NGO_EMAIL=ngo@example.com        # Test NGO account
TEST_NGO_PASSWORD=password             # Test NGO password
HEADLESS=true                          # Run Chrome headless
SCREENSHOT_ON_FAIL=true               # Take screenshots on failure
```

## Test Suites
| Suite | Tests | Category |
|-------|-------|----------|
| Login | 30 | Authentication |
| Registration | 25 | Registration |
| Dashboard | 25 | Dashboard |
| Donation | 35 | Donations |
| NGO | 30 | NGO |
| Profile | 20 | Profile |
| Requests | 35 | Requests/Matching |
| Navigation | 20 | Navigation |
| Validation | 20 | Validation |
| Extended | 50 | Analytics/AI/Sync/Session |
| **Total** | **290+** | All categories |

## Status Codes
- **PASS** — Assertion succeeded
- **FAIL** — Assertion failed
- **BLOCKED** — Environment unavailable (server down, credentials missing)
- **SKIPPED** — Test explicitly skipped

## Reports
Generated in `reports/` directory:
- `Selenium-E2E-Test-Report.xlsx` — Full Excel report
- `selenium-summary.json` — JSON summary
- `screenshots/` — Screenshots on failure
