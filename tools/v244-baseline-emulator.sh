#!/usr/bin/env bash
set -euo pipefail
mkdir -p out
APK=app/build/outputs/apk/debug/app-debug.apk
timeout 60s adb install -r "$APK"
timeout 25s adb shell pm clear com.aracimpro.app.neonpreview
echo "ANDROID15-v244 BASELINE" | tee out/v244-baseline-summary.txt
(timeout 55s adb logcat -v time -s AracimAdMob:I AndroidRuntime:E chromium:E '*:S' > out/v244-baseline-log.txt 2>&1) &
logpid=$!
sleep 1
timeout 20s adb shell am start -n com.aracimpro.app.neonpreview/com.aracimpro.app.MainActivity
success=0
for i in $(seq 1 35); do
  if grep -q 'v244_baseline_webview_ready' out/v244-baseline-log.txt && grep -q 'v244_baseline_splash_closed' out/v244-baseline-log.txt; then
     success=1; break
  fi
  sleep 1
done
if [ "$success" -eq 1 ]; then
  echo "PASS: known-good v244 WebView ready and splash removed" | tee -a out/v244-baseline-summary.txt
else
  echo "FAIL: v244 baseline also did NOT reach ready markers within 35s. Emulator may be unreliable." | tee -a out/v244-baseline-summary.txt
  tail -100 out/v244-baseline-log.txt >> out/v244-baseline-summary.txt
fi
timeout 10s adb shell screencap -p /sdcard/baseline.png || true
timeout 10s adb pull /sdcard/baseline.png out/baseline.png || true
kill "$logpid" 2>/dev/null || true
exit $((1-success))
