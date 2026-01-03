// Velocity Model - Wave propagation direction and speed
//
// Stores (vx, vy) velocity vectors at each grid point.
// Speed depends on depth: c = sqrt(g * depth)
// Direction is initially straight down (toward shore).
// Future: refraction bends waves toward shallower water.

import { assertSameSize } from '../../state/bathymetryModel';

const G = 9.81; // gravitational acceleration m/s²

export const FIELD_WIDTH = 60;
export const FIELD_HEIGHT = 40;

export interface VelocityField {
  vx: Float32Array;
  vy: Float32Array;
  width: number;
  gridHeight: number;
}

/**
 * Create velocity field with default values (straight down)
 */
export function createVelocityField(): VelocityField {
  const size = FIELD_WIDTH * FIELD_HEIGHT;
  return {
    vx: new Float32Array(size),
    vy: new Float32Array(size),
    width: FIELD_WIDTH,
    gridHeight: FIELD_HEIGHT,
  };
}

/**
 * Calculate wave celerity (speed) from depth
 * c = sqrt(g * depth)
 */
export function getWaveSpeed(depth: number): number {
  return Math.sqrt(G * Math.max(0.01, depth));
}

/**
 * Update velocity field from depth field
 * Direction is straight down (vx=0, vy=speed)
 *
 * @param velocityField - Velocity field to update (mutated)
 * @param depthData - Depth values at each grid cell (same size as velocity field)
 */
export function updateVelocityField(velocityField: VelocityField, depthData: Float32Array): void {
  const { vx, vy, width, gridHeight } = velocityField;
  assertSameSize(vy, depthData, 'updateVelocityField');

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const depth = depthData[idx];
      const speed = getWaveSpeed(depth);
      vx[idx] = 0;
      vy[idx] = speed;
    }
  }
}

/**
 * Get velocity at normalized position
 */
export function getVelocityAt(
  velocityField: VelocityField,
  normalizedX: number,
  normalizedY: number
): { vx: number; vy: number } {
  const { vx, vy, width, gridHeight } = velocityField;

  const gx = Math.floor(normalizedX * width);
  const gy = Math.floor(normalizedY * gridHeight);
  const x = Math.max(0, Math.min(width - 1, gx));
  const y = Math.max(0, Math.min(gridHeight - 1, gy));

  const idx = y * width + x;
  return { vx: vx[idx], vy: vy[idx] };
}
