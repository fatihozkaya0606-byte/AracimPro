#!/usr/bin/env bash
set -euo pipefail
# v251 smoke: adb becomes unresponsive on some hosted emulator boots.
# Never make an unbounded adb/logcat call. Capture logs from a SINGLE background
# reader and inspect the local file; require BOTH app-ready markers.
mkdir -p out
export ADB=adb
timeout 60s adb wait-for-device
timeout 60s adb install -r app/build/outputs/apk/debug/app-debug.apk
timeout 20s adb shell pm clear com.aracimpro.app.neonpreview
for trial in 1 2 3; do
  echo "COLD_START ${trial}" | tee -a out/v251-smoke-summary.txt
  timeout 12s adb shell am force-stop com.aracimpro.app.neonpreview || true
  timeout 15s adb logcat -c || true
  logfile="out/v251-android15-run${trial}.log"
  (timeout 90s adb logcat -v time > "$logfile" 2>&1) &
  logpid=$!
  sleep 2
  # Force-stop hung ADB; a device disappearing is a FAIL, not an infinite wait.
  if ! timeout 18s adb shell am start -n com.aracimpro.app.neonpreview/com.aracimpro.app.MainActivity; then
     echo "FAIL: am start stalled or emulator went offline in trial ${trial}" | tee -a out/v251-smoke-summary.txt
     kill "$logpid" 2>/dev/null || true
     exit 1
  fi
  ready=0
  for attempt in $(seq 1 60); do
    if grep -q 'webview_ready_249' "$logfile" && grep -q 'splash_closed251' "$logfile"; then
      ready=1
      break
    fi
    sleep 1
  done
  if [ "$ready" -ne 1 ]; then
    echo "FAIL: WebView or splash not ready in trial ${trial}" | tee -a out/v251-smoke-summary.txt
    tail -200 "$logfile" >> out/v251-smoke-summary.txt
    kill "$logpid" 2>/dev/null || true
    exit 1
  fi
  echo "PASS: WebView + splash closed in trial ${trial}" | tee -a out/v251-smoke-summary.txt
  kill "$logpid" 2>/dev/null || true
  wait "$logpid" 2>/dev/null || true
done
timeout 20s adb shell screencap -p /sdcard/v251-final.png || true
timeout 20s adb pull /sdcard/v251-final.png out/v251-final-android15.png || true
