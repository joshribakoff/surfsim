import { describe, it, expect } from 'vitest';
import { updateWorld, type WorldState } from './world';
import { createVelocityField, FIELD_WIDTH, FIELD_HEIGHT } from './03-velocity/model';
import { createEnergyField } from './02-energy/model';
import { createHeightField } from './04-height/model';
import { createFoamField } from './05-foam/model';

function createWorldState(): WorldState {
  return {
    velocity: createVelocityField(),
    energy: createEnergyField(),
    heightField: createHeightField(),
    foam: createFoamField(),
  };
}

/** Create a Float32Array of constant depth values */
function createConstantDepth(depth: number): Float32Array {
  const data = new Float32Array(FIELD_WIDTH * FIELD_HEIGHT);
  data.fill(depth);
  return data;
}

describe('updateWorld', () => {
  it('updates all layers without crashing', () => {
    const state = createWorldState();
    const depthData = createConstantDepth(10); // 10m everywhere

    expect(() => updateWorld(state, depthData, 0, 0.016)).not.toThrow();
  });

  it('propagates energy toward shore', () => {
    const state = createWorldState();
    const depthData = createConstantDepth(10);

    // Inject energy at horizon (row 0)
    for (let x = 0; x < state.energy.width; x++) {
      state.energy.height[x] = 1.0;
    }

    // Run several updates - energy propagates ~10m/s in 10m depth
    // Cell height ≈ 5.1m, so ~0.5s per row
    // After 3s, energy should be at row ~6 (not row 0 anymore)
    const TIME_DELTA = 0.1;
    let currTime = 0;
    for (let i = 0; i < 30; i++) {
      const prevTime = currTime;
      currTime += TIME_DELTA;
      updateWorld(state, depthData, prevTime, currTime);
    }

    // With shift-based advection (Plan 181), energy moves as a coherent block
    // Find where the energy band is now (should be around row 4-6)
    let foundEnergy = false;
    for (let y = 1; y < state.energy.gridHeight; y++) {
      let rowEnergy = 0;
      for (let x = 0; x < state.energy.width; x++) {
        rowEnergy += state.energy.height[y * state.energy.width + x];
      }
      if (rowEnergy > 0) {
        foundEnergy = true;
        break;
      }
    }

    // Energy should have propagated away from row 0
    expect(foundEnergy).toBe(true);
    // And row 0 should be empty (energy has moved down)
    let row0Energy = 0;
    for (let x = 0; x < state.energy.width; x++) {
      row0Energy += state.energy.height[x];
    }
    expect(row0Energy).toBe(0);
  });

  it('drains energy and spawns foam when breaking', () => {
    const state = createWorldState();
    // Shallow water (1m) causes breaking when height > 0.78m
    const depthData = createConstantDepth(1);

    // Set high energy that will cause breaking
    const midRow = Math.floor(state.energy.gridHeight / 2);
    for (let x = 0; x < state.energy.width; x++) {
      state.energy.height[midRow * state.energy.width + x] = 2.0;
    }

    const initialEnergy = state.energy.height[midRow * state.energy.width];

    updateWorld(state, depthData, 0, 0.1);

    // Energy should be drained
    const finalEnergy = state.energy.height[midRow * state.energy.width];
    expect(finalEnergy).toBeLessThan(initialEnergy);

    // Foam should be spawned
    let totalFoam = 0;
    for (let i = 0; i < state.foam.intensity.length; i++) {
      totalFoam += state.foam.intensity[i];
    }
    expect(totalFoam).toBeGreaterThan(0);
  });

  it('does not spawn foam in deep water', () => {
    const state = createWorldState();
    // Deep water (30m) - waves don't break
    const depthData = createConstantDepth(30);

    // Set moderate energy
    const midRow = Math.floor(state.energy.gridHeight / 2);
    for (let x = 0; x < state.energy.width; x++) {
      state.energy.height[midRow * state.energy.width + x] = 1.0;
    }

    updateWorld(state, depthData, 0, 0.1);

    // No foam should spawn (height/depth = 1/30 < 0.78)
    let totalFoam = 0;
    for (let i = 0; i < state.foam.intensity.length; i++) {
      totalFoam += state.foam.intensity[i];
    }
    expect(totalFoam).toBe(0);
  });

  it('decays foam over time', () => {
    const state = createWorldState();
    const depthData = createConstantDepth(10);

    // Manually add foam
    const midIdx = Math.floor(state.foam.intensity.length / 2);
    state.foam.intensity[midIdx] = 1.0;

    const initialFoam = state.foam.intensity[midIdx];

    // Run updates
    const TIME_DELTA = 0.1;
    let currTime = 0;
    for (let i = 0; i < 5; i++) {
      const prevTime = currTime;
      currTime += TIME_DELTA;
      updateWorld(state, depthData, prevTime, currTime);
    }

    // Foam should have decayed
    expect(state.foam.intensity[midIdx]).toBeLessThan(initialFoam);
  });
});
