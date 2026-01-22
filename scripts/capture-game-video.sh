#!/bin/bash
# Capture video of the game running for visual debugging
# Output: test-results/video-capture/game-capture.webm

set -e

cd "$(dirname "$0")/.."

echo "Capturing game video..."
npx playwright test packages/game/tests/e2e/capture-video.spec.js --reporter=list

VIDEO_PATH="test-results/video-capture/game-capture.webm"
if [ -f "$VIDEO_PATH" ]; then
  echo ""
  echo "Video saved: $(pwd)/$VIDEO_PATH"
  ls -la "$VIDEO_PATH"
else
  echo "ERROR: Video not found"
  exit 1
fi
