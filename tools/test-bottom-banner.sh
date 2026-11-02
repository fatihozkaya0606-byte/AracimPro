#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd -- "$(dirname -- "$0")/.." && pwd)"
banner_test_dir="$(mktemp -d)"
trap 'rm -rf -- "$banner_test_dir"' EXIT
java com.sun.tools.javac.Main -d "$banner_test_dir" \
  "$repo_dir/app/src/main/java/com/aracimpro/app/BottomBannerPolicy.java" \
  "$repo_dir/tests/BottomBannerPolicyTest.java"
java -cp "$banner_test_dir" com.aracimpro.app.BottomBannerPolicyTest
