import { defineStory, GRID_WIDTH, GRID_HEIGHT, createMatrix } from '../../../test-utils';

/**
 * Beach with deep channel in center.
 */
const story = defineStory({
  id: 'bathymetry/beach',
  title: 'Beach with Channel',
  prose: `Gradient to shore. Channel is 1.5x deeper than edges (relative, not absolute).`,
  initialMatrix: (() => {
    const matrix = createMatrix();
    const channelStart = Math.floor(GRID_WIDTH / 2) - 2;
    const channelEnd = Math.floor(GRID_WIDTH / 2) + 2;

    for (let row = 0; row < GRID_HEIGHT; row++) {
      const baseDepth = 1 - row / (GRID_HEIGHT - 1);

      for (let col = 0; col < GRID_WIDTH; col++) {
        const inChannel = col >= channelStart && col < channelEnd;
        // Channel is 1.5x deeper than edges, clamped to 1.0
        matrix[row][col] = inChannel ? Math.min(1.0, baseDepth * 1.5) : baseDepth;
      }
    }
    return matrix;
  })(),
  captureTimes: [0],
  expectedAscii: `
    t=0s
    FFFFFFFF
    EEFFFFEE
    DDFFFFDD
    CCFFFFCC
    BBDDDDBB
    44CCCC44
    33AAAA33
    22333322
    11222211
    --------
  `,
});

export default story;
export const PROGRESSION_BATHYMETRY = story.progression;
