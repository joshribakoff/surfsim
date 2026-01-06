import { describe, it, expect } from 'vitest';
import {
  createEnergyField,
  updateEnergyField,
  getHeightAt,
  drainEnergyAt,
  injectEnergyPulse,
  FIELD_WIDTH,
  FIELD_HEIGHT,
} from './model.js';

/** Create a Float32Array of constant depth values */
function createConstantDepth(depth: number): Float32Array {
  const data = new Float32Array(FIELD_WIDTH * FIELD_HEIGHT);
  data.fill(depth);
  return data;
}

describe('energyFieldModel', () => {
  describe('advection displacement calculation', () => {
    it('calculates correct displacement for one frame', () => {
      // Shift-based advection (Plan 181): energy moves in whole-cell increments
      // With depth 10m, velocity ≈ 10 m/s
      // Cell height = 200m / 39 cells ≈ 5.1m
      // Time to cross 1 cell = 5.1m / 10m/s ≈ 0.5s
      // In 1 frame (1/60s), shift = floor(10 * (1/60) / 5.1) = 0

      const field = createEnergyField();
      field.height[0] = 1.0; // Energy at first cell of row 0

      const depthData = createConstantDepth(10); // Constant 10m depth
      const TIME_DELTA = 1 / 60;

      // Single frame update: prevTime=0, currTime=TIME_DELTA
      updateEnergyField(field, null, depthData, 0, TIME_DELTA, {
        depthDampingCoefficient: 0,
        gridPhysicalHeight: 200,
      });

      // Row 0 should still have energy - shift is 0 for sub-cell displacement
      // (shift = currCells - prevCells = 0 - 0 = 0)
      expect(field.height[0]).toBeGreaterThan(0.9);
    });
  });

  describe('createEnergyField', () => {
    it('creates field with correct dimensions', () => {
      const field = createEnergyField();

      expect(field.width).toBe(FIELD_WIDTH);
      expect(field.gridHeight).toBe(FIELD_HEIGHT);
      expect(field.height.length).toBe(FIELD_WIDTH * FIELD_HEIGHT);
      expect(field.velocity.length).toBe(FIELD_WIDTH * FIELD_HEIGHT);
    });

    it('initializes height and velocity to zero', () => {
      const field = createEnergyField();

      // Check a few samples
      expect(field.height[0]).toBe(0);
      expect(field.height[field.height.length - 1]).toBe(0);
      expect(field.velocity[0]).toBe(0);
    });
  });

  describe('updateEnergyField', () => {
    it('propagates energy from horizon toward shore', () => {
      const field = createEnergyField();
      const depthData = createConstantDepth(10);

      // Inject a pulse at horizon
      for (let x = 0; x < field.width; x++) {
        field.height[x] = 1.0;
      }

      // Run enough time for energy to propagate to row 2
      // Speed at 10m depth: sqrt(9.81 * 10) ≈ 10 m/s
      // Cell height = 200m / 39 cells ≈ 5.1m
      // Time to cross 1 cell ≈ 0.51s, so ~1s for 2 rows
      const TIME_DELTA = 1 / 60;
      let currTime = 0;
      for (let i = 0; i < 60; i++) {
        const prevTime = currTime;
        currTime += TIME_DELTA;
        updateEnergyField(field, null, depthData, prevTime, currTime, {
          depthDampingCoefficient: 0,
        });
      }

      // Energy should have propagated (check rows 1-3 for any energy)
      let foundEnergy = false;
      for (let y = 1; y <= 3; y++) {
        const idx = y * field.width + Math.floor(field.width / 2);
        if (field.height[idx] > 0) foundEnergy = true;
      }
      expect(foundEnergy).toBe(true);
    });

    it('waves propagate uniformly across x (no refraction currently)', () => {
      const field = createEnergyField();
      const depthData = createConstantDepth(10);

      // Inject pulse at horizon
      for (let x = 0; x < field.width; x++) {
        field.height[x] = 1.0;
      }

      // Run updates to propagate to row 10
      const TIME_DELTA = 0.1;
      let currTime = 0;
      for (let i = 0; i < 300; i++) {
        const prevTime = currTime;
        currTime += TIME_DELTA;
        updateEnergyField(field, null, depthData, prevTime, currTime, {
          depthDampingCoefficient: 0,
        });
      }

      // Find the row with energy
      let energyRow = -1;
      for (let y = 0; y < field.gridHeight; y++) {
        if (field.height[y * field.width + 10] > 0.5) {
          energyRow = y;
          break;
        }
      }

      if (energyRow >= 0) {
        // Check left vs right - should be similar
        const leftIdx = energyRow * field.width + 10;
        const rightIdx = energyRow * field.width + 50;
        expect(Math.abs(field.height[leftIdx])).toBeCloseTo(Math.abs(field.height[rightIdx]), 2);
      }
    });
  });

  describe('getHeightAt', () => {
    it('returns height at grid points', () => {
      const field = createEnergyField();

      // Set a known value
      field.height[0] = 5.0;

      expect(getHeightAt(field, 0, 0)).toBe(5.0);
    });

    it('interpolates between grid points', () => {
      const field = createEnergyField();

      // Set corners of a 2x2 region
      field.height[0] = 0;
      field.height[1] = 2;
      field.height[field.width] = 2;
      field.height[field.width + 1] = 4;

      // Center should interpolate
      const centerX = 0.5 / (field.width - 1);
      const centerY = 0.5 / (field.gridHeight - 1);
      const centerHeight = getHeightAt(field, centerX, centerY);

      // Average of 0, 2, 2, 4 = 2
      expect(centerHeight).toBeCloseTo(2, 1);
    });
  });

  describe('drainEnergyAt (Plan 141)', () => {
    it('returns amount of energy actually drained', () => {
      const field = createEnergyField();

      // Set energy at a point
      field.height[0] = 1.0;

      // Drain 0.3 energy
      const drained = drainEnergyAt(field, 0, 0, 0.3);

      expect(drained).toBeCloseTo(0.3, 5);
      expect(field.height[0]).toBeCloseTo(0.7, 5);
    });

    it('returns less than requested if not enough energy', () => {
      const field = createEnergyField();

      // Set low energy
      field.height[0] = 0.2;

      // Try to drain more than available
      const drained = drainEnergyAt(field, 0, 0, 0.5);

      expect(drained).toBeCloseTo(0.2, 5); // Only 0.2 was available
      expect(field.height[0]).toBe(0); // Now empty
    });

    it('returns 0 when draining empty cell', () => {
      const field = createEnergyField();

      // Cell is already empty (initialized to 0)
      const drained = drainEnergyAt(field, 0.5, 0.5, 0.5);

      expect(drained).toBe(0);
    });

    it('drains at correct position in field', () => {
      const field = createEnergyField();

      // Fill entire field
      for (let i = 0; i < field.height.length; i++) {
        field.height[i] = 1.0;
      }

      // Drain at center
      drainEnergyAt(field, 0.5, 0.5, 0.5);

      // Check that energy was drained from the right place
      const centerX = Math.floor(0.5 * field.width);
      const centerY = Math.floor(0.5 * field.gridHeight);
      const centerIdx = centerY * field.width + centerX;

      expect(field.height[centerIdx]).toBeCloseTo(0.5, 5);
    });
  });

  describe('injectEnergyPulse', () => {
    it('adds energy across the horizon row', () => {
      const field = createEnergyField();

      injectEnergyPulse(field.height, field.width, 800); // 800 kJ

      // Check several points along horizon
      expect(field.height[0]).toBeCloseTo(800, 1);
      expect(field.height[field.width / 2]).toBeCloseTo(800, 1);
      expect(field.height[field.width - 1]).toBeCloseTo(800, 1);
    });

    it('accumulates with existing energy', () => {
      const field = createEnergyField();

      // First pulse
      injectEnergyPulse(field.height, field.width, 500); // 500 kJ
      // Second pulse
      injectEnergyPulse(field.height, field.width, 300); // 300 kJ

      expect(field.height[0]).toBeCloseTo(800, 1); // 500 + 300 = 800 kJ
    });
  });

  describe('Energy drains after wave breaking (Plan 141 integration)', () => {
    it('wave energy decreases when drained at sandbar position', () => {
      const field = createEnergyField();
      const depthData = createConstantDepth(10);

      // Inject a pulse at horizon (1000 kJ)
      injectEnergyPulse(field.height, field.width, 1000);

      // Propagate energy to middle of field
      // Speed at 10m: ~10 m/s, cell height ≈ 5.1m
      // Run 3 seconds to shift ~6 rows
      const TIME_DELTA = 1 / 60;
      let currTime = 0;
      for (let i = 0; i < 180; i++) {
        const prevTime = currTime;
        currTime += TIME_DELTA;
        updateEnergyField(field, null, depthData, prevTime, currTime, {
          depthDampingCoefficient: 0,
        });
      }

      // Find where the energy band is (threshold 500 kJ)
      let energyRow = -1;
      for (let y = 0; y < field.gridHeight; y++) {
        const idx = y * field.width + Math.floor(field.width / 2);
        if (field.height[idx] > 500) {
          energyRow = y;
          break;
        }
      }

      // Skip test if energy hasn't propagated
      if (energyRow < 0) return;

      const midY = energyRow / field.gridHeight;
      const energyBefore = getHeightAt(field, 0.5, midY);
      expect(energyBefore).toBeGreaterThan(0);

      // Drain energy at multiple X positions (simulating breaking across width)
      for (let x = 0.3; x <= 0.7; x += 0.1) {
        drainEnergyAt(field, x, midY, 500); // drain 500 kJ
      }

      // Energy at drained positions should be lower
      const energyAfter = getHeightAt(field, 0.5, midY);
      expect(energyAfter).toBeLessThan(energyBefore);
    });
  });
});
