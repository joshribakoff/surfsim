import { GRID_WIDTH, GRID_HEIGHT } from '../../test-utils';

/**
 * Create depth data - gradient to shore with central channel.
 * Values are in METERS. Channel is 1.5x deeper than edges.
 *
 * @param maxDepth - Depth at horizon in meters (caller decides)
 * @param width - Grid width
 * @param height - Grid height
 */
export function createDepthData(
  maxDepth: number,
  width: number = GRID_WIDTH,
  height: number = GRID_HEIGHT
): Float32Array {
  const data = new Float32Array(width * height);
  const channelStart = Math.floor(width / 2) - Math.floor(width / 4);
  const channelEnd = Math.floor(width / 2) + Math.floor(width / 4);

  for (let row = 0; row < height; row++) {
    const depth = (1 - row / (height - 1)) * maxDepth;

    for (let col = 0; col < width; col++) {
      const inChannel = col >= channelStart && col < channelEnd;
      data[row * width + col] = inChannel ? Math.min(maxDepth, depth * 1.5) : depth;
    }
  }
  return data;
}

/** For stories - uses default 8x10 grid with 30m max depth */
export function initialMatrix(): Float32Array {
  return createDepthData(30);
}
