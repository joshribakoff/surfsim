import { defineStory, asciiToMatrix, GRID_WIDTH, GRID_HEIGHT } from '../../../test-utils';
import { updateEnergyField } from '../model';
import { updateVelocityField } from '../../03-velocity/model';
import { PROGRESSION_BATHYMETRY } from '../../01-depth/stories/01-bathymetry';

// Read depth directly from Layer 1's matrix (0-1 scaled to 0-30m)
const depthMatrix = PROGRESSION_BATHYMETRY.snapshots[0].matrix;
const MAX_DEPTH = 30;

function getDepth(normalizedX: number, normalizedY: number): number {
  const col = Math.min(GRID_WIDTH - 1, Math.floor(normalizedX * GRID_WIDTH));
  const row = Math.min(GRID_HEIGHT - 1, Math.floor(normalizedY * GRID_HEIGHT));
  return depthMatrix[row][col] * MAX_DEPTH;
}

function createVelocityField(width: number, height: number) {
  const size = width * height;
  return {
    vx: new Float32Array(size),
    vy: new Float32Array(size),
    width,
    gridHeight: height,
  };
}

const STORY_GRID_PHYSICAL_HEIGHT = 100; // 100m for 10 rows

const story = defineStory({
  id: 'energy-field/propagation',
  title: 'Energy Propagation',
  prose: `Energy propagates over Layer 1 bathymetry. Channel is 1.5x deeper than edges.`,
  initialMatrix: asciiToMatrix(`
FFFFFFFF
--------
--------
--------
--------
--------
--------
--------
--------
--------`),
  assertInitialAscii: `
    FFFFFFFF
    --------
    --------
    --------
    --------
    --------
    --------
    --------
    --------
    --------
  `,
  captureTimes: [0, 1, 2, 3, 4, 5],
  updateFn: (field, dt) => {
    if (!field._velocityField) {
      field._velocityField = createVelocityField(field.width, field.gridHeight);
      updateVelocityField(field._velocityField, getDepth);
    }

    updateEnergyField(field, field._velocityField, getDepth, dt, {
      depthDampingCoefficient: 1.5,
      depthDampingExponent: 2.0,
      gridPhysicalHeight: STORY_GRID_PHYSICAL_HEIGHT,
    });
  },
  expectedAscii: `
    t=0s      t=1s      t=2s      t=3s      t=4s      t=5s
    FFFFFFFF  22222222  --------  --------  --------  --------
    --------  33333333  22111122  11----11  --------  --------
    --------  33333333  22222222  11111111  11----11  --------
    --------  11111111  22222222  22222222  11111111  11----11
    --------  --------  22222222  22222222  22111122  11111111
    --------  --------  11111111  22222222  22222222  22111122
    --------  --------  --------  11111111  22222222  22222222
    --------  --------  --------  --1111--  11111111  11222211
    --------  --------  --------  --------  --1111--  11111111
    --------  --------  --------  --------  --------  --------
  `,
});

export default story;
export const PROGRESSION_PROPAGATION = story.progression;
