/**
 * Shared constants for Height stories
 *
 * Height = energy × (refDepth/depth)^0.25 (shoaling)
 */

export { GRID_WIDTH, GRID_HEIGHT, createMatrix } from '../../test-utils';
export type { Matrix } from '../../test-utils';

// Reference depth for shoaling calculation
export const REFERENCE_DEPTH = 10;

// Depth functions for stories
export const shallowGradient = (_x: number, y: number) => 10 - y * 9.5; // 10m horizon → 0.5m shore
