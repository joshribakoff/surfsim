// Public API for Layer 01: Depth (Bathymetry)
// Ocean floor depth map - defines where waves break based on shallow water

// Model exports - physics/simulation
export { DEFAULT_BATHYMETRY, getDepth, getMinDepth, getPeakX } from './model';

// Renderer exports - production rendering
export { buildBathymetryCache, createBathymetryCacheManager, depthToColor } from './renderer';

// Story exports
export { PROGRESSION_BATHYMETRY, getDepth as getBathymetryDepth } from './stories/01-bathymetry';
