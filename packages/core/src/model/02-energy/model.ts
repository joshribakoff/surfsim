// Energy Field Wave Model
// Continuous 2D field where waves are emergent peaks, not discrete objects
//
// The field stores height values at each grid point. Waves propagate via
// the wave equation with depth-dependent speed from bathymetry.

import { assertSameSize } from '../../utils/assertSameSize';
import { getWaveSpeed, type VelocityField } from '../03-velocity/model';
import { GRID_WIDTH, GRID_HEIGHT } from '../../test-utils';

/**
 * Inject energy pulse at horizon row (accumulates with existing energy).
 * @param matrix - Energy field as flat Float32Array
 * @param width - Grid width (columns)
 * @param energyKJ - Energy in kilojoules (50-2000 typical range)
 */
export function injectEnergyPulse(matrix: Float32Array, width: number, energyKJ: number): void {
  for (let col = 0; col < width; col++) {
    matrix[col] += energyKJ;
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
export const FIELD_HEIGHT = 40; // Y resolution (horizon to shore)

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
 * Update the energy field with forward transfer advection and damping.
 *
 * @param field - Energy field to update (mutated)
 * @param velocityField - Velocity field with (vx, vy) at each cell
 * @param depthData - Depth values at each grid cell (same size as energy field)
 * @param dt - Time step in seconds
 * @param options - { depthDampingCoefficient, depthDampingExponent, gridPhysicalHeight }
 */
export function updateEnergyField(
  field,
  velocityField: VelocityField | null,
  depthData: Float32Array,
  dt,
  options: Record<string, any> = {}
) {
  const { height, width, gridHeight } = field;
  assertSameSize(height, depthData, 'updateEnergyField');
  const { depthDampingCoefficient = 1.5, gridPhysicalHeight = GRID_PHYSICAL_HEIGHT } = options;

  // Cell size in meters
  const cellHeight = gridPhysicalHeight / (gridHeight - 1);

  // Buffer for transferred energy
  const transfers = new Float32Array(height.length);

  // Calculate transfers from each cell
  for (let y = 0; y < gridHeight - 1; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Get velocity at this cell (in meters/second)
      let vy: number;
      if (velocityField) {
        vy = velocityField.vy[idx];
      } else {
        const depth = depthData[idx];
        vy = getWaveSpeed(depth);
      }

      // What fraction of energy transfers to next cell this frame?
      const fraction = Math.min(1, (vy * dt) / cellHeight);

      // Transfer that fraction to the cell below
      const transfer = height[idx] * fraction;
      const destIdx = (y + 1) * width + x;

      transfers[idx] -= transfer; // Remove from source
      transfers[destIdx] += transfer; // Add to destination
    }
  }

  // Apply transfers with distance-based damping
  // Energy loss is proportional to distance traveled AND inversely proportional to depth
  // Shallow water = more bottom friction = more energy lost per meter traveled
  for (let y = 0; y < gridHeight - 1; y++) {
    for (let x = 0; x < width; x++) {
      const destIdx = (y + 1) * width + x;

      // Get depth at destination (where energy is arriving)
      const destDepth = Math.max(0.01, depthData[destIdx]);

      // Energy loss increases as depth decreases (more bottom friction)
      // frictionFactor: 1.0 at depth=10m, higher in shallower water
      const frictionFactor = 10 / destDepth;

      // The transfer amount for this cell (already calculated above)
      const transferIn = transfers[destIdx] > 0 ? transfers[destIdx] : 0;

      // Apply friction to the incoming energy
      // Higher friction = more energy lost during the transfer
      const frictionLoss =
        transferIn * Math.min(0.9, depthDampingCoefficient * 0.1 * frictionFactor);
      transfers[destIdx] -= frictionLoss;
    }
  }

  // Apply transfers
  for (let i = 0; i < height.length; i++) {
    height[i] += transfers[i];
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
