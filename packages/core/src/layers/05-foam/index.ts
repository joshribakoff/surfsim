// Public API for Layer 05: Foam
// Foam intensity grid with decay, diffusion, advection

// Model exports
export {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  DEFAULT_FOAM_CONFIG,
  createFoamField,
  shouldBreak,
  applyDecay,
  applyDiffusion,
  applyAdvection,
  spawnFoam,
  updateFoamField,
  getFoamAt,
} from './model';
export type { FoamField, FoamConfig } from './model';

// Legacy shared utilities (for stories)
export { GRID_WIDTH, GRID_HEIGHT, createMatrix } from './shared';
export type { Matrix } from './shared';

// Story exports (consolidated)
export { default as foamDynamicsStory, PROGRESSION_FOAM } from './stories/01-foam-dynamics';
