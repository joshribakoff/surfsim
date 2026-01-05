import { defineStory } from '../../../test-utils';
import { getWaveSpeed } from '../model';
import { GRID_WIDTH, GRID_HEIGHT, shallowGradient, MAX_SPEED } from '../shared';

/**
 * Compute velocity field (normalized speed) from depth gradient.
 * Speed = sqrt(g * depth), slower in shallow water.
 */
function computeVelocityMatrix(): Float32Array {
  const matrix = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
  for (let row = 0; row < GRID_HEIGHT; row++) {
    const normalizedY = row / (GRID_HEIGHT - 1);
    for (let col = 0; col < GRID_WIDTH; col++) {
      const normalizedX = (col + 0.5) / GRID_WIDTH;
      const depth = shallowGradient(normalizedX, normalizedY);
      const speed = getWaveSpeed(depth);
      matrix[row * GRID_WIDTH + col] = speed / MAX_SPEED; // Normalize to 0-1
    }
  }
  return matrix;
}

const story = defineStory({
  title: 'Velocity from Depth',
  prose: `Wave celerity (speed) depends on depth: c = √(g × d).

Physics:
- Deep water (10m): ~10 m/s (bright)
- Shallow water (0.5m): ~2.2 m/s (dim)
- Waves slow down as they approach shore`,
  initialMatrix: computeVelocityMatrix(),
  captureTimes: [0], // Static - velocity doesn't change
  expectedAscii: `
    t=0s
    FFFFFFFF
    EEEEEEEE
    EEEEEEEE
    DDDDDDDD
    DDDDDDDD
    CCCCCCCC
    BBBBBBBB
    AAAAAAAA
    44444444
    22222222
  `,
});

export default story;
export const PROGRESSION_VELOCITY = story.progression;
