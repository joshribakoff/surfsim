/**
 * Foam Dynamics Story
 *
 * Demonstrates foam behavior using the shared model:
 * - Decay: foam fades over time
 * - Diffusion: foam spreads outward
 * - Advection: foam drifts toward shore
 */
import { defineStory, asciiToMatrix } from '../../../test-utils';
import { updateFoamField } from '../model';

const story = defineStory({
  id: 'foam/dynamics',
  title: 'Foam Dynamics',
  prose: `Foam behavior using production model.

Physics:
- Decay: exponential fade (bubbles pop)
- Diffusion: lateral spreading
- Advection: drift toward shore

All three effects combined in updateFoamField().`,
  initialMatrix: asciiToMatrix(`
----------
----------
----------
---FFFF---
---FFFF---
----------
----------
----------
----------
----------`),
  assertInitialAscii: `
    ----------
    ----------
    ----------
    ---FFFF---
    ---FFFF---
    ----------
    ----------
    ----------
    ----------
    ----------
  `,
  captureTimes: [0, 1, 2, 3, 4, 5],
  updateFn: (field, dt) => {
    updateFoamField(
      { intensity: field.height, width: field.width, gridHeight: field.gridHeight },
      dt,
      {
        decayRate: 0.35,
        diffusionRate: 0.15,
        advectionSpeed: 0.5,
      }
    );
  },
  expectedAscii: `
    t=0s        t=1s        t=2s        t=3s        t=4s        t=5s
    ----------  ----------  ----------  ----------  ----------  ----------
    ----------  ----------  ----------  ----------  ----------  ----------
    ----------  ---1111---  ----------  ----------  ----------  ----------
    ---FFFF---  --144441--  ---1221---  ---1111---  ----------  ----------
    ---FFFF---  --1ABBA1--  --123321--  ---1221---  ---1111---  ----------
    ----------  ---3333---  --123321--  ---1221---  ---1111---  ----11----
    ----------  ---1111---  ---1111---  ---1111---  ---1111---  ---1111---
    ----------  ----------  ----11----  ---1111---  ---1111---  ----11----
    ----------  ----------  ----------  ----------  ----------  ----------
    ----------  ----------  ----------  ----------  ----------  ----------
  `,
});

export default story;
export const PROGRESSION_FOAM = story.progression;
