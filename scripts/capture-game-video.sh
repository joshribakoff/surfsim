#!/bin/bash
# Capture game video for agent visual feedback loop
# Output: test-results/video-capture/

set -e

echo "Starting game video capture..."
npx playwright test packages/game/tests/e2e/capture-video.spec.js --headed --project=chromium

echo "Video capture complete. Output in test-results/video-capture/"
echo "To view trace: npx playwright show-trace test-results/video-capture/trace.zip"
