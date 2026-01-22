// @ts-check
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Capture video of the game for agent visual feedback loop.
 * Run with: npm run capture-game-video (or npx playwright test capture-video.spec.js)
 *
 * Output: test-results/video-capture/game-capture.webm
 */
test('capture game video for agent debugging', async ({ page, context }) => {
  // Ensure output directory exists
  const outputDir = 'test-results/video-capture';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Start recording video
  await context.tracing.start({ screenshots: true, snapshots: true });

  // Go to game
  await page.goto('/');

  // Wait for canvas to be visible
  await page.waitForSelector('canvas', { timeout: 5000 });

  // Record for 5 seconds to capture animation
  await page.waitForTimeout(5000);

  // Stop and save tracing
  await context.tracing.stop({ path: path.join(outputDir, 'trace.zip') });
});

test.describe.configure({ mode: 'serial' });
