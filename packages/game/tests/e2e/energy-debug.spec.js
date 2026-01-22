// @ts-check
import { test, expect } from '@playwright/test';

test('energy conservation with damping=0', async ({ page }) => {
  const logs = [];

  // Capture console logs
  page.on('console', (msg) => {
    if (msg.text().includes('[Energy]')) {
      logs.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Enable energy field (press E)
  await page.keyboard.press('e');

  // Set damping to 0 via the debug panel slider
  // First need to check if debug panel is open
  const dampingSlider = page.locator('input[type="range"]').first();
  if (await dampingSlider.isVisible()) {
    await dampingSlider.fill('0');
  }

  // Wait and collect logs
  await page.waitForTimeout(5000);

  // Analyze the logs
  console.log('\n=== ENERGY LOGS ===');
  for (const log of logs) {
    console.log(log);
  }

  // Calculate total energy from each log
  console.log('\n=== ANALYSIS ===');
  const maxValues = logs.map((log) => {
    const match = log.match(/max=([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  });

  if (maxValues.length > 2) {
    const first = maxValues[0];
    const last = maxValues[maxValues.length - 1];
    const decayPercent = ((first - last) / first) * 100;
    const perSecondDecay = decayPercent / maxValues.length;
    console.log(`First max: ${first} kJ`);
    console.log(`Last max: ${last} kJ`);
    console.log(`Decay: ${decayPercent.toFixed(1)}% over ${maxValues.length} seconds`);
    console.log(`Per-second decay: ${perSecondDecay.toFixed(1)}%`);
  }

  // This test is for debugging - always pass but show output
  expect(logs.length).toBeGreaterThan(0);
});

test('log total field energy (not just row 0)', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Enable energy field
  await page.keyboard.press('e');
  await page.waitForTimeout(500);

  // Inject code to log total energy
  const results = await page.evaluate(async () => {
    const logs = [];

    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 500));

      // @ts-ignore
      const field = window.world?.energyField;
      if (field) {
        let total = 0;
        let maxVal = 0;
        let nonZeroCount = 0;

        for (let j = 0; j < field.height.length; j++) {
          const v = field.height[j];
          total += v;
          if (v > maxVal) maxVal = v;
          if (v > 0.1) nonZeroCount++;
        }

        logs.push({
          second: i,
          total: total.toFixed(1),
          max: maxVal.toFixed(1),
          nonZeroCells: nonZeroCount,
          gridSize: field.height.length,
        });
      }
    }

    return logs;
  });

  console.log('\n=== TOTAL FIELD ENERGY OVER TIME ===');
  console.table(results);

  // Check if total energy is being conserved
  if (results.length > 2) {
    const firstTotal = parseFloat(results[0].total);
    const lastTotal = parseFloat(results[results.length - 1].total);
    const change = (((lastTotal - firstTotal) / firstTotal) * 100).toFixed(1);
    console.log(`\nTotal energy change: ${change}%`);
    console.log(`(Positive = energy increasing from new waves, Negative = energy leaking)`);
  }

  expect(results.length).toBeGreaterThan(0);
});
