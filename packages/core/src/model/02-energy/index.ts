// Public API for Layer 02: Energy Field
// Continuous 2D field where waves are emergent peaks, not discrete objects

// Model exports - physics/simulation
export {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  GRID_PHYSICAL_HEIGHT,
  createEnergyField,
  updateEnergyField,
  getHeightAt,
  injectWavePulse,
  drainEnergyAt,
} from './model';

// Renderer exports - canonical Viridis-based rendering
export {
  renderEnergyField,
  renderEnergyFieldFast,
  renderEnergyMatrix,
  type EnergyRenderOptions,
} from './renderer';
