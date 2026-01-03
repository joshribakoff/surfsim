import { defineStory, GRID_WIDTH, GRID_HEIGHT, createMatrix } from '../../../test-utils';

/**
 * Realistic beach bathymetry: slope with channel.
 * Deep channel in center causes waves to refract (bend toward shallow sides).
 */
const story = defineStory({
  id: 'bathymetry/beach',
  title: 'Beach with Channel',
  prose: `Realistic beach: slope from horizon to shore with deep channel in center.

Base gradient: F (30m) at horizon to 0 at shore.
Channel: +30% depth in center columns (waves travel faster here).

This creates wave refraction:
- Center advances faster (deeper = faster: c = √(g×d))
- Sides lag behind (shallower = slower)
- Wave band bends into a "V" shape pointing shoreward`,
  initialMatrix: (() => {
    const matrix = createMatrix();
    const channelCol = Math.floor(GRID_WIDTH / 2);

    for (let row = 0; row < GRID_HEIGHT; row++) {
      const baseDepth = 1 - row / (GRID_HEIGHT - 1);

      for (let col = 0; col < GRID_WIDTH; col++) {
        const distFromChannel = Math.abs(col - channelCol);
        // Channel: deeper in center (+0.3), shallower on sides (-0.2 at edges)
        const channelEffect = distFromChannel <= 1 ? 0.3 : distFromChannel <= 2 ? -0.2 : 0;
        matrix[row][col] = Math.max(0, Math.min(1, baseDepth + channelEffect));
      }
    }
    return matrix;
  })(),
  captureTimes: [0],
  expectedAscii: `
    t=0s
    FFDFFFDF
    EECFFFCE
    DDBFFFBD
    CCAFFFAC
    BB4EEE4B
    442CCC24
    331BBB13
    22-AAA-2
    11-444-1
    ---333--
  `,
});

export default story;
export const PROGRESSION_BATHYMETRY = story.progression;

/**
 * Depth function for use by other layers (energy, velocity, height, foam).
 * Returns depth in meters at normalized (x, y) position.
 */
export function getDepth(normalizedX: number, normalizedY: number): number {
  const baseDepth = 30 * (1 - normalizedY); // 30m at horizon, 0 at shore

  // Channel in center (x=0.5)
  const distFromCenter = Math.abs(normalizedX - 0.5) * 2; // 0 at center, 1 at edges
  const channelBonus = distFromCenter < 0.25 ? 9 : distFromCenter < 0.5 ? -6 : 0;

  return Math.max(0.5, baseDepth + channelBonus);
}
