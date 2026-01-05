import { describe, it, expect } from 'vitest';
import { viridisToRgb, viridisToColor, energyToColor } from './colorScales';

describe('colorScales', () => {
  describe('viridisToRgb', () => {
    it('returns dark purple at 0', () => {
      const color = viridisToRgb(0);
      // Library values (matplotlib viridis)
      expect(color).toEqual({ r: 68, g: 1, b: 84 });
    });

    it('returns bright yellow at 1', () => {
      const color = viridisToRgb(1);
      // Library values (matplotlib viridis)
      expect(color).toEqual({ r: 251, g: 231, b: 35 });
    });

    it('clamps values below 0', () => {
      const color = viridisToRgb(-0.5);
      expect(color).toEqual({ r: 68, g: 1, b: 84 });
    });

    it('clamps values above 1', () => {
      const color = viridisToRgb(1.5);
      expect(color).toEqual({ r: 251, g: 231, b: 35 });
    });

    it('interpolates smoothly at midpoint', () => {
      const color = viridisToRgb(0.5);
      // Should be in the cyan/teal range
      expect(color.g).toBeGreaterThan(140);
      expect(color.b).toBeGreaterThan(130);
    });
  });

  describe('viridisToColor', () => {
    it('returns CSS hex string at 0', () => {
      const color = viridisToColor(0);
      expect(color).toBe('#440154');
    });

    it('returns CSS hex string at 1', () => {
      const color = viridisToColor(1);
      expect(color).toBe('#fbe723');
    });
  });

  describe('energyToColor - perceptual uniformity for visual testing', () => {
    it('produces visually distinct colors for low vs high damping values', () => {
      const lowDampingColor = viridisToRgb(0.25);
      const highDampingColor = viridisToRgb(0.02);

      console.log('\n=== Perceptual color test ===');
      console.log('High damping (0.02):', energyToColor(0.02));
      console.log('Low damping (0.25):', energyToColor(0.25));

      const rDiff = Math.abs(lowDampingColor.r - highDampingColor.r);
      const gDiff = Math.abs(lowDampingColor.g - highDampingColor.g);
      const bDiff = Math.abs(lowDampingColor.b - highDampingColor.b);
      const maxDiff = Math.max(rDiff, gDiff, bDiff);

      console.log(`RGB differences: r=${rDiff}, g=${gDiff}, b=${bDiff}, max=${maxDiff}`);

      expect(maxDiff).toBeGreaterThan(30);
    });

    it('shows perceptually uniform gradient', () => {
      console.log('\nViridis gradient (0 to 1 in 0.1 steps):');
      for (let v = 0; v <= 1.0; v += 0.1) {
        console.log(`  ${v.toFixed(1)} -> ${energyToColor(v)}`);
      }
    });
  });
});
