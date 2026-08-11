#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Starting Mobile E2E Appium CI Test Suite Execution"
echo "=========================================================="

# 1. Dynamically read GITHUB_PATH if available and inject into PATH
if [ -n "${GITHUB_PATH}" ] && [ -f "${GITHUB_PATH}" ]; then
  echo "[CI] Injecting GITHUB_PATH into PATH..."
  while IFS= read -r line || [ -n "$line" ]; do
    if [ -n "$line" ]; then
      export PATH="$line:$PATH"
    fi
  done < "${GITHUB_PATH}"
fi

# Ensure node and npm are available
echo "[CI] Node version: $(node -v || echo 'Not found')"
echo "[CI] NPM version: $(npm -v || echo 'Not found')"
echo "[CI] ADB version: $(adb --version | head -n 1 || echo 'Not found')"

# 2. Determine APK location and install onto emulator
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${APP_DIR}"

if [ -z "${APK_PATH}" ]; then
  POSSIBLE_PATHS=(
    "${ROOT_DIR}/android/app/build/outputs/apk/debug/app-debug.apk"
    "${ROOT_DIR}/app/build/outputs/apk/debug/app-debug.apk"
    "${APP_DIR}/app-debug.apk"
  )
  for p in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$p" ]; then
      APK_PATH="$p"
      break
    fi
  done
fi

if [ -n "${APK_PATH}" ] && [ -f "${APK_PATH}" ]; then
  echo "[CI] Found APK at: ${APK_PATH}"
  echo "[CI] Installing debug APK onto emulator..."
  adb wait-for-device
  adb install -r "${APK_PATH}" || echo "[CI WARN] adb install failed or app already up to date."
else
  echo "[CI WARN] APK_PATH not specified or APK file not found. Proceeding with emulator session..."
fi

# 3. Start Appium Server in background
echo "[CI] Starting Appium server on port 4723..."
mkdir -p /tmp
appium --log-level warn > /tmp/appium.log 2>&1 &
APPIUM_PID=$!
echo "[CI] Appium PID: ${APPIUM_PID}"

# 4. Wait for Appium to respond on port 4723
echo "[CI] Polling Appium server until ready..."
MAX_RETRIES=30
RETRY_COUNT=0
READY=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://127.0.0.1:4723/status | grep -q '"ready":true'; then
    echo "[CI] Appium server is UP and READY!"
    READY=1
    break
  elif curl -s http://127.0.0.1:4723/status > /dev/null 2>&1; then
    echo "[CI] Appium server is listening on port 4723."
    READY=1
    break
  fi
  echo "[CI] Waiting for Appium... (attempt $((RETRY_COUNT+1))/${MAX_RETRIES})"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $READY -eq 0 ]; then
  echo "[CI ERROR] Appium server failed to start within $((MAX_RETRIES*2)) seconds."
  echo "--- Appium Log Output ---"
  cat /tmp/appium.log || true
fi

# 5. Execute WDIO Test Suite with Fallback Trap
set +e
echo "[CI] Launching WebDriverIO 1,111-Test Suite..."
node node_modules/@wdio/cli/bin/wdio.js run wdio.conf.js
WDIO_EXIT_CODE=$?

# If WDIO failed or exited early, generate fallback report
if [ $WDIO_EXIT_CODE -ne 0 ]; then
  echo "[CI WARN] WDIO exited with code ${WDIO_EXIT_CODE}. Running fallback report generator..."
  node utils/generateFallbackReport.js || true
else
  echo "[CI] WDIO test suite completed successfully (Exit Code 0)."
fi

# Cleanup Appium process
if kill -0 $APPIUM_PID 2>/dev/null; then
  echo "[CI] Terminating Appium server PID: ${APPIUM_PID}"
  kill $APPIUM_PID || true
fi

echo "=========================================================="
echo " Mobile E2E Appium CI Test Suite Execution Finished"
echo "=========================================================="

exit $WDIO_EXIT_CODE
