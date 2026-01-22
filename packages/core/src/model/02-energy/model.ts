// Energy Field Wave Model
// Continuous 2D field where waves are emergent peaks, not discrete objects
//
// The field stores height values at each grid point. Waves propagate via
// shift-based advection (Plan 181) - energy moves as coherent blocks,
// not via diffusive percentage transfer.
//
// Key insight: The CFL number (velocity * dt / cellHeight) is a DISPLACEMENT,
// not a transfer coefficient. See plans/model/181-advection-shift-algorithm.md

import { assertSameSize } from '../../utils/assertSameSize';
import { getWaveSpeed, type VelocityField } from '../03-velocity/model';
import { GRID_WIDTH, GRID_HEIGHT } from '../../test-utils';

/**
 * Inject energy pulse at horizon (accumulates with existing energy).
 * @param matrix - Energy field as flat Float32Array
 * @param width - Grid width (columns)
 * @param energyKJ - Energy in kilojoules (50-2000 typical range)
 * @param thickness - Number of rows to spread energy across (default 2)
 */
export function injectEnergyPulse(
  matrix: Float32Array,
  width: number,
  energyKJ: number,
  thickness: number = 2
): void {
  for (let row = 0; row < thickness; row++) {
    for (let col = 0; col < width; col++) {
      matrix[row * width + col] += energyKJ;
    }
  }
}

/**
 * Create initial energy matrix - empty with energy pulse at horizon.
 */
export function initialMatrix(): Float32Array {
  const matrix = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
  injectEnergyPulse(matrix, GRID_WIDTH, 500); // 500 kJ - medium wave
  return matrix;
}

// Grid resolution - balance between accuracy and performance
export const FIELD_WIDTH = 60; // X resolution (across screen)
export const FIELD_HEIGHT = 80; // Y resolution (horizon to shore) - doubled for smoother animation

// Physical dimensions (meters)
export const GRID_PHYSICAL_HEIGHT = 200; // Distance from horizon to shore in meters

/**
 * Create a new energy field
 * @returns {object} Energy field with height and velocity arrays
 */
export function createEnergyField() {
  const size = FIELD_WIDTH * FIELD_HEIGHT;
  return {
    // Current height at each grid point
    height: new Float32Array(size),
    // Velocity (rate of change) for wave equation
    velocity: new Float32Array(size),
    // Dimensions
    width: FIELD_WIDTH,
    gridHeight: FIELD_HEIGHT,
  };
}

/**
 * Shift the energy field down by a given number of rows.
 * Energy moves as a coherent block - no diffusion. (Plan 181)
 *
 * @param field - Energy field to shift (mutated)
 * @param rows - Number of rows to shift down (positive = toward shore)
 */
export function shiftFieldDown(
  field: { height: Float32Array; width: number; gridHeight: number },
  rows: number
): void {
  if (rows <= 0) return;

  const { height, width, gridHeight } = field;

  // Copy from bottom up to avoid overwriting source data
  for (let y = gridHeight - 1; y >= rows; y--) {
    for (let x = 0; x < width; x++) {
      height[y * width + x] = height[(y - rows) * width + x];
    }
  }

  // Clear vacated top rows (energy that shifted in from beyond horizon)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      height[y * width + x] = 0;
    }
  }
}

/**
 * Update the energy field with shift-based advection and damping.
 * Replaces diffusive percentage transfer with coherent block movement. (Plan 181)
 *
 * CURRENT: Assumes 100% downward velocity (single direction toward shore).
 * FUTURE: Will read from velocityField to support multi-directional propagation
 *         and directional energy fields (towardShore, towardLeft, towardRight).
 *         See Plan 181 "Future: Directional Energy Fields" section.
 *
 * @param field - Energy field to update (mutated)
 * @param velocityField - Velocity field (currently unused - assumes downward)
 * @param depthData - Depth values at each grid cell (same size as energy field)
 * @param prevTime - Simulation time at start of frame (seconds)
 * @param currTime - Simulation time at end of frame (seconds)
 * @param options - { depthDampingCoefficient, gridPhysicalHeight }
 */
export function updateEnergyField(
  field,
  velocityField: VelocityField | null,
  depthData: Float32Array,
  prevTime: number,
  currTime: number,
  options: Record<string, any> = {}
) {
  const { height, width, gridHeight } = field;
  assertSameSize(height, depthData, 'updateEnergyField');
  const { depthDampingCoefficient = 1.5, gridPhysicalHeight = GRID_PHYSICAL_HEIGHT } = options;

  // Delta time derived from prev/curr (used for damping)
  const dt = currTime - prevTime;

  // Cell size in meters
  const cellHeight = gridPhysicalHeight / (gridHeight - 1);

  // === SHIFT-BASED ADVECTION (Plan 181) ===
  //
  // WHY CUMULATIVE TIME? With small dt (e.g., 1/60s at 60fps), velocity × dt
  // is much smaller than cellHeight, so floor(v × dt / h) = 0 every frame.
  // The wave would never move. Using cumulative time lets us detect when
  // total displacement crosses cell boundaries:
  //
  //   shift = floor(currTime × v / h) - floor(prevTime × v / h)
  //
  // This gives shift=1 exactly when we cross a cell boundary, regardless
  // of frame rate. Energy moves as a coherent block - TRUE advection
  // (∂E/∂t + v·∂E/∂x = 0), not diffusion.

  // Calculate average velocity across field (Option A from Plan 181)
  // FUTURE: Could use per-column velocity for depth-dependent speed (Option B)
  // FUTURE: Could read from velocityField for 2D refraction
  let totalVelocity = 0;
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const depth = depthData[idx];
      totalVelocity += getWaveSpeed(depth);
    }
  }
  const avgVelocity = totalVelocity / (width * gridHeight);

  // Shift = how many cell boundaries we crossed this frame
  const prevCells = Math.floor((prevTime * avgVelocity) / cellHeight);
  const currCells = Math.floor((currTime * avgVelocity) / cellHeight);
  const shift = currCells - prevCells;

  // Shift the field down (toward shore) by the calculated amount
  // All energy moves as a block - no "50% here, 50% there" diffusion
  if (shift > 0) {
    shiftFieldDown(field, shift);
  }

  // === DEPTH-DEPENDENT DAMPING ===
  // Applied as a separate pass AFTER the shift (Plan 181 Phase 3)
  // Energy loss is inversely proportional to depth (bottom friction)
  // This affects MAGNITUDE, not spreading - keeps the pulse sharp
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const depth = Math.max(0.01, depthData[idx]);

      // frictionFactor: 1.0 at depth=10m, higher in shallower water
      const frictionFactor = 10 / depth;

      // Damping rate per second (scaled by dt for frame-independent behavior)
      const dampingRate = depthDampingCoefficient * 0.1 * frictionFactor * dt;
      const damping = Math.min(0.9, dampingRate); // Cap at 90% per frame

      height[idx] *= 1 - damping;
    }
  }
}

/**
 * Get height at a normalized position (with bilinear interpolation)
 * @param {object} field - Energy field
 * @param {number} normalizedX - X position (0-1)
 * @param {number} normalizedY - Y position (0-1, 0=horizon, 1=shore)
 * @returns {number} Interpolated height value
 */
export function getHeightAt(field, normalizedX, normalizedY) {
  const { height, width, gridHeight } = field;

  // Convert to grid coordinates
  const gx = normalizedX * (width - 1);
  const gy = normalizedY * (gridHeight - 1);

  // Get integer grid indices
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, gridHeight - 1);

  // Fractional parts for interpolation
  const fx = gx - x0;
  const fy = gy - y0;

  // Sample four corners
  const h00 = height[y0 * width + x0];
  const h10 = height[y0 * width + x1];
  const h01 = height[y1 * width + x0];
  const h11 = height[y1 * width + x1];

  // Bilinear interpolation
  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;
  return h0 * (1 - fy) + h1 * fy;
}

/**
 * Drain energy at a specific position (when foam is deposited)
 * @param {object} field - Energy field
 * @param {number} normalizedX - X position (0-1)
 * @param {number} normalizedY - Y position (0-1, 0=horizon, 1=shore)
 * @param {number} amount - Amount of energy to drain (0-1)
 * @returns {number} Amount of energy actually drained (may be less than requested if not enough energy)
 */
export function drainEnergyAt(field, normalizedX, normalizedY, amount) {
  const { height, width, gridHeight } = field;

  // Convert to grid coordinates
  const gx = Math.floor(normalizedX * width);
  const gy = Math.floor(normalizedY * gridHeight);

  // Clamp to valid range
  const x = Math.max(0, Math.min(width - 1, gx));
  const y = Math.max(0, Math.min(gridHeight - 1, gy));

  const idx = y * width + x;
  const currentEnergy = height[idx];

  // Treat negative heights as zero energy for dissipation purposes
  const available = Math.max(0, currentEnergy);
  const drained = Math.min(available, amount);

  // Reduce positive energy; leave negative components untouched (they don't contribute to dissipation)
  const remaining = currentEnergy - drained;
  height[idx] = remaining < 0 ? 0 : remaining;
  return drained;
}
