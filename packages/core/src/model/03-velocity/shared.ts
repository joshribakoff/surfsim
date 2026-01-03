/**
 * Shared constants for Velocity stories
 *
 * Velocity = sqrt(g * depth), slower in shallow water.
 */

export { GRID_WIDTH, GRID_HEIGHT, createMatrix } from '../../test-utils';
export type { Matrix } from '../../test-utils';

// Reference speed for normalization (10m deep water)
export const MAX_SPEED = Math.sqrt(9.81 * 10); // ~9.9 m/s

// Depth functions for stories
export const deepWater = () => 10;
export const shallowGradient = (_x: number, y: number) => 10 - y * 9.5; // 10m at horizon → 0.5m at shore
