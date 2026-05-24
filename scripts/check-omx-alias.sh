#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

stdout_file="$(mktemp)"
stderr_file="$(mktemp)"

cleanup() {
  rm -f "$stdout_file" "$stderr_file"
}
trap cleanup EXIT

node dist/cli/omx.js >"$stdout_file" 2>"$stderr_file"

grep -q 'vclaw - video-first clean-room core' "$stdout_file"
grep -q 'temporary compatibility alias' "$stderr_file"

echo "omx compatibility alias check passed"
