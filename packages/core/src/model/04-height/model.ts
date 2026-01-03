// Height Model - Wave surface elevation (shoaling)
//
// Height is derived from energy and depth via shoaling:
// height = energy × (reference_depth / local_depth)^(1/4)
//
// As waves slow down in shallow water, they grow taller.
// This is the physical basis of wave breaking.

import { assertSameSize } from '../../state/bathymetryModel';

export const FIELD_WIDTH = 60;
export const FIELD_HEIGHT = 40;

export interface HeightField {
  height: Float32Array;
  width: number;
  gridHeight: number;
}

/**
 * Create empty height field
 */
export function createHeightField(): HeightField {
  const size = FIELD_WIDTH * FIELD_HEIGHT;
  return {
    height: new Float32Array(size),
    width: FIELD_WIDTH,
    gridHeight: FIELD_HEIGHT,
  };
}

/**
 * Apply shoaling formula: height = energy × (refDepth / depth)^(1/4)
 *
 * @param energy - Wave energy at this point
 * @param depth - Local water depth in meters
 * @param referenceDepth - Deep water reference depth (default 30m)
 * @returns Surface height
 */
export function computeHeight(energy: number, depth: number, referenceDepth = 30): number {
  const MIN_DEPTH = 0.01;
  const safeDepth = Math.max(MIN_DEPTH, depth);
  const shoalingFactor = Math.pow(referenceDepth / safeDepth, 0.25);
  return energy * shoalingFactor;
}

/**
 * Update height field from energy field and depth data
 *
 * @param heightField - Height field to update (mutated)
 * @param energyData - Energy values (Float32Array)
 * @param depthData - Depth values at each grid cell (same size)
 * @param referenceDepth - Deep water reference depth
 */
export function updateHeightField(
  heightField: HeightField,
  energyData: Float32Array,
  depthData: Float32Array,
  referenceDepth = 30
): void {
  const { height, width, gridHeight } = heightField;
  assertSameSize(height, depthData, 'updateHeightField');
  assertSameSize(height, energyData, 'updateHeightField');

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      height[idx] = computeHeight(energyData[idx], depthData[idx], referenceDepth);
    }
  }
}

/**
 * Get height at normalized position
 */
export function getHeightAt(
  heightField: HeightField,
  normalizedX: number,
  normalizedY: number
): number {
  const { height, width, gridHeight } = heightField;

  const gx = Math.floor(normalizedX * width);
  const gy = Math.floor(normalizedY * gridHeight);
  const x = Math.max(0, Math.min(width - 1, gx));
  const y = Math.max(0, Math.min(gridHeight - 1, gy));

  return height[y * width + x];
}
