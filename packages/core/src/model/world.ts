// World Orchestrator - Coordinates all layer updates
//
// Layers are pure and independently testable.
// This module owns cross-layer physics (breaking → foam).
//
// Update order:
// 1. Velocity from depth (03 reads 01)
// 2. Energy propagation (02 reads 03)
// 3. Height from energy+depth (04 reads 02, 01)
// 4. Breaking detection → drain energy → spawn foam
// 5. Foam internal dynamics (decay, diffusion, advection)

import { assertSameSize } from '../utils/assertSameSize';
import { updateVelocityField, type VelocityField } from './03-velocity/model';
import { updateEnergyField, drainEnergyAt } from './02-energy/model';
import { updateHeightField, type HeightField } from './04-height/model';
import {
  shouldBreak,
  spawnFoam,
  updateFoamField,
  type FoamField,
  type FoamConfig,
  DEFAULT_FOAM_CONFIG,
} from './05-foam/model';

export interface EnergyField {
  height: Float32Array;
  velocity: Float32Array;
  width: number;
  gridHeight: number;
}

export interface WorldState {
  velocity: VelocityField;
  energy: EnergyField;
  heightField: HeightField;
  foam: FoamField;
}

export interface WorldConfig {
  referenceDepth?: number;
  depthDampingCoefficient?: number;
  depthDampingExponent?: number;
  foam?: Partial<FoamConfig>;
}

/**
 * Update all layers in correct order with cross-layer physics
 *
 * @param state - World state containing all layer fields
 * @param depthData - Depth values at each grid cell (same size as other fields)
 * @param dt - Time step in seconds
 * @param config - Optional configuration
 */
export function updateWorld(
  state: WorldState,
  depthData: Float32Array,
  dt: number,
  config: WorldConfig = {}
): void {
  const { referenceDepth = 30, foam: foamConfig = {} } = config;
  const { velocity, energy, heightField, foam } = state;
  assertSameSize(heightField.height, depthData, 'updateWorld');

  // 1. Update velocity from depth (03 reads 01)
  updateVelocityField(velocity, depthData);

  // 2. Update energy propagation (02 reads 03)
  updateEnergyField(energy, velocity, depthData, dt, {
    depthDampingCoefficient: config.depthDampingCoefficient,
    depthDampingExponent: config.depthDampingExponent,
  });

  // 3. Update height from energy+depth (04 reads 02, 01)
  updateHeightField(heightField, energy.height, depthData, referenceDepth);

  // 4. Breaking detection → drain energy → spawn foam
  const breakerIndex = foamConfig.breakerIndex ?? DEFAULT_FOAM_CONFIG.breakerIndex;
  const spawnRate = foamConfig.spawnRate ?? DEFAULT_FOAM_CONFIG.spawnRate;

  const { width, gridHeight } = heightField;
  for (let y = 0; y < gridHeight; y++) {
    const normalizedY = y / (gridHeight - 1);
    for (let x = 0; x < width; x++) {
      const normalizedX = (x + 0.5) / width;
      const idx = y * width + x;

      const height = heightField.height[idx];
      const depth = depthData[idx];

      if (shouldBreak(height, depth, breakerIndex)) {
        // Drain energy proportional to excess height
        const excessRatio = height / (breakerIndex * depth) - 1;
        const drainAmount = Math.min(energy.height[idx], excessRatio * 0.5);

        const released = drainEnergyAt(energy, normalizedX, normalizedY, drainAmount);

        // Spawn foam from released energy
        if (released > 0) {
          spawnFoam(foam, normalizedX, normalizedY, released * spawnRate);
        }
      }
    }
  }

  // 5. Foam internal dynamics (decay, diffusion, advection)
  updateFoamField(foam, dt, foamConfig);
}
