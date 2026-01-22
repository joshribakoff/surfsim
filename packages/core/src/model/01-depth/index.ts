// Public API for Layer 01: Depth
// Ocean floor depth map - defines where waves break based on shallow water

// Model exports - depth data creation
export { createDepthData, initialMatrix } from './model';

// Renderer exports - production rendering
export {
  buildBathymetryCache,
  createBathymetryCacheManager,
  depthToColor,
  sampleDepth,
} from './renderer';
