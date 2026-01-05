import { defineStory, GRID_WIDTH, GRID_HEIGHT } from '../../../test-utils';
import { updateEnergyField, initialMatrix } from '../model';
import depthStory from '../../01-depth/stories/01-depth';

// Depth field from Layer 1 - already in meters (0-30m)
const depthData = depthStory.progression.snapshots[0].matrix;

const STORY_GRID_PHYSICAL_HEIGHT = 100; // 100m for 10 rows

const story = defineStory({
  title: 'Energy Propagation',
  prose: `Energy propagates over Layer 1 bathymetry. Channel is 1.5x deeper than edges.`,
  initialMatrix: initialMatrix(),
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
  updateFn: (model, dt) => {
    // Wrap the Float32Array in the structure updateEnergyField expects
    const energyModel = {
      height: model,
      width: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
    };

    // Pass null for velocityField - updateEnergyField will calculate
    // downward velocity from depth automatically
    updateEnergyField(energyModel, null, depthData, dt, {
      depthDampingCoefficient: 1.5,
      depthDampingExponent: 2.0,
      gridPhysicalHeight: STORY_GRID_PHYSICAL_HEIGHT,
    });
  },
  expectedAscii: `
    t=0s      t=1s      t=2s      t=3s      t=4s      t=5s
    FFFFFFFF  22222222  --------  --------  --------  --------
    --------  33333333  22111122  --------  --------  --------
    --------  22222222  22222222  11111111  11----11  --------
    --------  11111111  22222222  22222222  11111111  11----11
    --------  --------  11222211  22222222  22111122  11111111
    --------  --------  11111111  22222222  22222222  22111122
    --------  --------  --------  11111111  22222222  22222222
    --------  --------  --------  --1111--  11111111  11222211
    --------  --------  --------  --------  --1111--  11111111
    --------  --------  --------  --------  --------  --------
  `,
});

export default story;
