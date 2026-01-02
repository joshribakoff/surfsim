import { defineStory, asciiToMatrix } from '../../../test-utils';
import { updateEnergyField } from '../model';
import { updateVelocityField } from '../../03-velocity/model';
import { getDepth } from '../../01-depth/stories/01-bathymetry';

// Create velocity field sized for small story grid
function createSmallVelocityField(width: number, height: number) {
  const size = width * height;
  return {
    vx: new Float32Array(size),
    vy: new Float32Array(size),
    width,
    gridHeight: height,
  };
}

// Physical grid height for stories (60m = 10m per row for 6 rows)
const STORY_GRID_PHYSICAL_HEIGHT = 60;

const story = defineStory({
  id: 'energy-field/propagation',
  title: 'Energy Propagation',
  prose: `Energy propagates from horizon to shore over channel bathymetry.

Bathymetry: slope with deep channel in center (from 01-depth layer).
- Center columns: deeper → faster propagation
- Edge columns: shallower → slower propagation

Physics:
- Wave speed = √(gravity × depth) — faster in deep water
- Forward transfer: each cell passes fraction of energy to next cell
- Friction: energy lost per meter traveled, stronger in shallow water
- Refraction: wave band bends as center advances faster than edges

At shore (t=5s), energy accumulates but dissipates via bottom friction.`,
  initialMatrix: asciiToMatrix(`
FFFFF
-----
-----
-----
-----
-----`),
  assertInitialAscii: `
    FFFFF
    -----
    -----
    -----
    -----
    -----
  `,
  captureTimes: [0, 1, 2, 3, 4, 5],
  updateFn: (field, dt) => {
    // Initialize velocity field on first call (store on field object)
    if (!field._velocityField) {
      field._velocityField = createSmallVelocityField(field.width, field.gridHeight);
      updateVelocityField(field._velocityField, getDepth);
    }

    updateEnergyField(field, field._velocityField, getDepth, dt, {
      depthDampingCoefficient: 1.5,
      depthDampingExponent: 2.0,
      gridPhysicalHeight: STORY_GRID_PHYSICAL_HEIGHT,
    });
  },
  // Forward transfer advection:
  // - Each cell transfers a fraction of energy to the cell below
  // - Fraction based on velocity (faster in deep water)
  // - Refraction visible: uneven pattern due to channel bathymetry
  expectedAscii: `
    t=0s   t=1s   t=2s   t=3s   t=4s   t=5s
    FFFFF  23232  11-11  -----  -----  -----
    -----  44344  22122  11-11  -----  -----
    -----  22322  33233  22122  11111  -1-1-
    -----  11111  22322  33233  23132  12121
    -----  -----  1-2-1  2-2-2  2-2-2  21112
    -----  -----  --1--  --3--  --A--  --B--
  `,
});

export default story;
export const PROGRESSION_PROPAGATION = story.progression;
