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
    FFFFFFFF
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
  updateFn: (model, prevTime, currTime) => {
    // Wrap the Float32Array in the structure updateEnergyField expects
    const energyModel = {
      height: model,
      width: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
    };

    // Pass null for velocityField - updateEnergyField will calculate
    // downward velocity from depth automatically
    updateEnergyField(energyModel, null, depthData, prevTime, currTime, {
      depthDampingCoefficient: 1.5,
      depthDampingExponent: 2.0,
      gridPhysicalHeight: STORY_GRID_PHYSICAL_HEIGHT,
    });
  },
  expectedAscii: `
    t=0s      t=1s      t=2s      t=3s      t=4s      t=5s
    FFFFFFFF  --------  --------  --------  --------  --------
    FFFFFFFF  FFFFFFFF  --------  --------  --------  --------
    --------  EEFFFFEE  EEEEEEEE  --------  --------  --------
    --------  --------  EEEEEEEE  DDEEEEDD  --------  --------
    --------  --------  --------  DDEEEEDD  DDDDDDDD  --------
    --------  --------  --------  --------  CCDDDDCC  CCDDDDCC
    --------  --------  --------  --------  --------  CCCCCCCC
    --------  --------  --------  --------  --------  --------
    --------  --------  --------  --------  --------  --------
    --------  --------  --------  --------  --------  --------
  `,
});

export default story;
