/**
 * Height Shoaling Story
 *
 * Shows how surface height is derived from energy + depth.
 * Energy propagates via discrete advection; height = energy × shoaling_factor.
 */
import { defineStory, asciiToMatrix } from '../../../test-utils';
import { updateEnergyField } from '../../02-energy/model';
import { computeHeight } from '../model';

// Story grid dimensions (from ASCII matrix)
const STORY_WIDTH = 5;
const STORY_HEIGHT = 6;

// Depth: 10m at horizon → 0.5m at shore
const REFERENCE_DEPTH = 10;

// Physical grid height for stories (60m = 10m per row for 6 rows)
const STORY_GRID_PHYSICAL_HEIGHT = 60;

// Create depth field: shallow gradient from 10m to 0.5m
function createDepthData(): Float32Array {
  const data = new Float32Array(STORY_WIDTH * STORY_HEIGHT);
  for (let y = 0; y < STORY_HEIGHT; y++) {
    const normalizedY = y / (STORY_HEIGHT - 1);
    const depth = 10 - normalizedY * 9.5;
    for (let x = 0; x < STORY_WIDTH; x++) {
      data[y * STORY_WIDTH + x] = depth;
    }
  }
  return data;
}

const depthData = createDepthData();

/**
 * Update: energy propagates via energy model, height derived via height model.
 *
 * Key: We track energy in a separate array (_energy) and only write height
 * to field.height for display. This prevents corrupting energy with height values.
 */
function updateFn(field: any, dt: number): void {
  const { width, gridHeight } = field;

  // Initialize separate energy storage on first call
  if (!field._energy) {
    field._energy = new Float32Array(field.height);
  }

  // Create a proxy field that points energy operations at _energy
  const energyField = {
    height: field._energy,
    velocity: field.velocity,
    width,
    gridHeight,
  };

  // Step 1: Propagate energy (null velocity = fallback to depth-based speed)
  updateEnergyField(energyField, null, depthData, dt, {
    depthDampingCoefficient: 0, // No damping to show pure shoaling
    depthDampingExponent: 2.0,
    gridPhysicalHeight: STORY_GRID_PHYSICAL_HEIGHT,
  });

  // Step 2: Derive height from energy + depth via shoaling (output to field.height)
  for (let i = 0; i < field.height.length; i++) {
    const energy = field._energy[i];
    const depth = depthData[i];
    field.height[i] = computeHeight(energy, depth, REFERENCE_DEPTH);
  }
}

const story = defineStory({
  id: 'height/shoaling',
  title: 'Height Shoaling',
  prose: `Surface height derived from energy via shoaling.

Physics:
- Energy propagates toward shore (discrete advection, depth-dependent speed)
- Height = energy × (refDepth/depth)^0.25
- Same energy produces taller waves in shallow water
- Faster propagation in deeper water creates spreading pattern
- No damping applied to isolate shoaling effect`,
  initialMatrix: asciiToMatrix(`
DDDDD
-----
-----
-----
-----
-----`),
  assertInitialAscii: `
    DDDDD
    -----
    -----
    -----
    -----
    -----
  `,
  captureTimes: [0, 1, 2, 3, 4, 5],
  updateFn,
  expectedAscii: `
    t=0s   t=1s   t=2s   t=3s   t=4s   t=5s
    DDDDD  44444  22222  11111  -----  -----
    -----  33333  33333  22222  11111  11111
    -----  11111  33333  33333  22222  22222
    -----  -----  11111  22222  33333  33333
    -----  -----  11111  11111  22222  33333
    -----  -----  -----  11111  22222  33333
  `,
});

export default story;
export const PROGRESSION_SHOALING = story.progression;
