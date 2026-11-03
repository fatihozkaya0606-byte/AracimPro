#!/usr/bin/env bash
# Android 15 automated actual startup check for Aracim Pro v251.
# Called as ONE script by android-emulator-runner: each workflow script
# line is executed as a separate shell command.
set -euo pipefail
mkdir -p out
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell pm clear com.aracimpro.app.neonpreview
for trial in 1 2 3; do
  echo "=== Cold start ${trial} ===" | tee -a out/v251-smoke-summary.txt
  adb shell am force-stop com.aracimpro.app.neonpreview || true
  adb logcat -c
  adb shell am start -n com.aracimpro.app.neonpreview/com.aracimpro.app.MainActivity
  success=0
  for attempt in $(seq 1 50); do
    if adb logcat -d -s AracimAdMob:I '*:S' | grep -q 'splash_closed251'; then
      if adb logcat -d -s AracimAdMob:I '*:S' | grep -q 'webview_ready_249'; then
        success=1
        break
      fi
    fi
    sleep 1
  done
  adb logcat -d -v time > "out/v251-android15-run${trial}.log"
  if [ "$success" -ne 1 ]; then
    echo "FAIL: HOME was not ready / splash not removed within 50 seconds on run ${trial}" | tee -a out/v251-smoke-summary.txt
    exit 1
  fi
  echo "PASS: HOME WebView loaded and splash removed on run ${trial}" | tee -a out/v251-smoke-summary.txt
  adb shell dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity' | head -2 | tee -a out/v251-smoke-summary.txt || true
done
adb shell screencap -p /sdcard/v251-final.png
adb pull /sdcard/v251-final.png out/v251-final-android15.png
