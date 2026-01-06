// Foam Model - Foam intensity grid
//
// Consolidates all foam-related processes:
// - Breaking detection: height / depth > 0.78 triggers spawn
// - Spawning: energy drain → foam deposit
// - Decay: foam fades over time
// - Spreading: diffusion outward
// - Advection: drift toward shore / longshore current

export const FIELD_WIDTH = 60;
export const FIELD_HEIGHT = 80;

export interface FoamField {
  intensity: Float32Array;
  width: number;
  gridHeight: number;
}

export interface FoamConfig {
  breakerIndex: number; // height/depth ratio for breaking (default 0.78)
  spawnRate: number; // foam added per unit energy drained
  decayRate: number; // exponential decay per second
  diffusionRate: number; // lateral spreading rate
  advectionSpeed: number; // drift toward shore (rows/second)
}

export const DEFAULT_FOAM_CONFIG: FoamConfig = {
  breakerIndex: 0.78,
  spawnRate: 1.0,
  decayRate: 0.35, // production value
  diffusionRate: 0.15,
  advectionSpeed: 0.5,
};

/**
 * Create empty foam field
 */
export function createFoamField(): FoamField {
  const size = FIELD_WIDTH * FIELD_HEIGHT;
  return {
    intensity: new Float32Array(size),
    width: FIELD_WIDTH,
    gridHeight: FIELD_HEIGHT,
  };
}

/**
 * Check if wave should break at given position
 */
export function shouldBreak(height: number, depth: number, breakerIndex = 0.78): boolean {
  return height > breakerIndex * depth;
}

/**
 * Apply exponential decay to foam
 */
export function applyDecay(foam: FoamField, dt: number, decayRate: number): void {
  const { intensity } = foam;
  const factor = Math.exp(-decayRate * dt);
  for (let i = 0; i < intensity.length; i++) {
    intensity[i] *= factor;
  }
}

/**
 * Apply diffusion (spreading outward via laplacian)
 */
export function applyDiffusion(foam: FoamField, dt: number, rate: number): void {
  const { intensity, width, gridHeight } = foam;
  const prev = new Float32Array(intensity);

  for (let y = 1; y < gridHeight - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        prev[idx - width] + prev[idx + width] + prev[idx - 1] + prev[idx + 1] - 4 * prev[idx];
      intensity[idx] = Math.max(0, prev[idx] + rate * laplacian * dt);
    }
  }
}

/**
 * Apply advection (drift toward shore)
 */
export function applyAdvection(foam: FoamField, dt: number, speed: number): void {
  const { intensity, width, gridHeight } = foam;
  const prev = new Float32Array(intensity);

  // Work from bottom to top to avoid overwriting
  for (let y = gridHeight - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const srcY = y - speed * dt;

      if (srcY >= 0 && srcY < gridHeight - 1) {
        const y0 = Math.floor(srcY);
        const y1 = y0 + 1;
        const frac = srcY - y0;
        const src0 = y0 * width + x;
        const src1 = y1 * width + x;
        intensity[idx] = prev[src0] * (1 - frac) + prev[src1] * frac;
      } else if (srcY < 0) {
        intensity[idx] = 0; // No foam from beyond horizon
      }
    }
  }
}

/**
 * Spawn foam at position from energy drain
 */
export function spawnFoam(
  foam: FoamField,
  normalizedX: number,
  normalizedY: number,
  amount: number
): void {
  const { intensity, width, gridHeight } = foam;

  const gx = Math.floor(normalizedX * width);
  const gy = Math.floor(normalizedY * gridHeight);
  const x = Math.max(0, Math.min(width - 1, gx));
  const y = Math.max(0, Math.min(gridHeight - 1, gy));

  const idx = y * width + x;
  intensity[idx] = Math.min(1.0, intensity[idx] + amount);
}

/**
 * Full foam update: decay, diffusion, advection
 * Breaking/spawning handled separately via energy interaction
 */
export function updateFoamField(
  foam: FoamField,
  dt: number,
  config: Partial<FoamConfig> = {}
): void {
  const { decayRate, diffusionRate, advectionSpeed } = {
    ...DEFAULT_FOAM_CONFIG,
    ...config,
  };

  applyDecay(foam, dt, decayRate);
  applyDiffusion(foam, dt, diffusionRate);
  applyAdvection(foam, dt, advectionSpeed);
}

/**
 * Get foam intensity at normalized position
 */
export function getFoamAt(foam: FoamField, normalizedX: number, normalizedY: number): number {
  const { intensity, width, gridHeight } = foam;

  const gx = Math.floor(normalizedX * width);
  const gy = Math.floor(normalizedY * gridHeight);
  const x = Math.max(0, Math.min(width - 1, gx));
  const y = Math.max(0, Math.min(gridHeight - 1, gy));

  return intensity[y * width + x];
}
