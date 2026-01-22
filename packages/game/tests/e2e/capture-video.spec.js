import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Video capture test for agent visual feedback loop
// Output: test-results/video-capture/game-capture.webm
test.describe('Video Capture', () => {
  test('captures 5 seconds of gameplay', async ({ browser }) => {
    const outputDir = path.join(process.cwd(), 'test-results', 'video-capture');
    const finalPath = path.join(outputDir, 'game-capture.webm');

    // Clean up old captures
    fs.mkdirSync(outputDir, { recursive: true });
    for (const file of fs.readdirSync(outputDir)) {
      fs.unlinkSync(path.join(outputDir, file));
    }

    const context = await browser.newContext({
      recordVideo: {
        dir: outputDir,
        size: { width: 1280, height: 720 },
      },
    });

    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#game')).toBeVisible();

    // Let the game run for 5 seconds
    await page.waitForTimeout(5000);

    // Close context to finalize video
    await context.close();

    // Rename to predictable filename
    const files = fs.readdirSync(outputDir);
    const videoFile = files.find((f) => f.endsWith('.webm'));
    expect(videoFile).toBeTruthy();

    fs.renameSync(path.join(outputDir, videoFile), finalPath);
    console.log(`Video saved: ${finalPath}`);
  });
});
