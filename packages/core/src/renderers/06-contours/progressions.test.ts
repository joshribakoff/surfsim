import { describe, it, expect } from 'vitest';
import { getProgression } from '../../test-utils';
import { PROGRESSION_SINGLE_CIRCLE, FOAM_STRIP_BASIC } from './stories/01-basic-shapes';
import { FOAM_STRIP_EDGE_CASES } from './stories/03-edge-cases';
import { GRID_SIZE } from './shared';

describe('foamContoursProgressions', () => {
  it('registers foam contour progressions for discovery', () => {
    expect(getProgression('foam-contours/single-circle')).toBe(PROGRESSION_SINGLE_CIRCLE);
  });

  it('creates a radial peak for the single circle progression', () => {
    const snapshot = PROGRESSION_SINGLE_CIRCLE.snapshots[0];
    const width = snapshot.width;

    // Matrix should be 16x16 = 256 elements
    expect(snapshot.matrix.length).toBe(GRID_SIZE * GRID_SIZE);
    expect(snapshot.width).toBe(GRID_SIZE);
    expect(snapshot.height).toBe(GRID_SIZE);

    // Center should have high value (flat index: 8 * 16 + 8 = 136)
    expect(snapshot.matrix[8 * width + 8]).toBeGreaterThan(0.75);

    // Corners should be 0
    expect(snapshot.matrix[0]).toBe(0);
    expect(snapshot.matrix[15 * width + 15]).toBe(0);
  });

  it('converts progressions into labeled strip frames with correct extremes', () => {
    const singleLabel = FOAM_STRIP_BASIC.snapshots[0].label;
    expect(singleLabel).toBe('Single Circle');

    const emptyFrame = FOAM_STRIP_EDGE_CASES.snapshots.find((f) =>
      f.label.toLowerCase().includes('empty')
    );
    expect(emptyFrame).toBeDefined();
    expect(Math.max(...(emptyFrame?.grid ?? []))).toBe(0);

    const fullFrame = FOAM_STRIP_EDGE_CASES.snapshots.find((f) =>
      f.label.toLowerCase().includes('full')
    );
    expect(fullFrame).toBeDefined();
    expect(Math.min(...(fullFrame?.grid ?? []))).toBeGreaterThan(0.85);
  });
});
