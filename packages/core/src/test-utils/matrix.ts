/**
 * Matrix Utilities
 *
 * Centralized matrix type and utilities used across all model layers.
 * All model layers use consistent dimensions for composability.
 */

/**
 * Standard grid dimensions for the model pipeline (8x10).
 * Most model layers use these dimensions for composability.
 */
export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 10;

/**
 * Alternative grid dimensions for model layers that need different sizes.
 * Model layer 09 (foam-contours) uses 16x16, layers 05-08 use 10x10.
 */
export const GRID_10x10 = { width: 10, height: 10 };
export const GRID_16x16 = { width: 16, height: 16 };

/**
 * Capture times for static (non-animated) progressions.
 * Used by model layers 01-02 which show bathymetry/damping that don't change over time.
 */
export const STATIC_CAPTURE = [0];

/**
 * Create a zero-filled Float32Array with standard 8x10 dimensions
 */
export function createMatrix(): Float32Array {
  return new Float32Array(GRID_WIDTH * GRID_HEIGHT);
}

/**
 * Create a zero-filled Float32Array with custom dimensions
 */
export function createMatrixWithSize(width: number, height: number): Float32Array {
  return new Float32Array(width * height);
}

/**
 * Create a Float32Array filled with a specific value (standard 8x10 dimensions)
 */
export function createFilledMatrix(value: number): Float32Array {
  const data = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
  data.fill(value);
  return data;
}

/**
 * Create a Float32Array filled with a specific value and custom dimensions
 */
export function createFilledMatrixWithSize(
  value: number,
  width: number,
  height: number
): Float32Array {
  const data = new Float32Array(width * height);
  data.fill(value);
  return data;
}
