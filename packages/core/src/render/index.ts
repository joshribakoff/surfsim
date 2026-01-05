/**
 * Render Module Index
 *
 * Re-exports all rendering functions for clean imports in main.jsx
 */

// Depth rendering (from model/01-depth)
export {
  buildBathymetryCache,
  depthToColor,
  createBathymetryCacheManager,
  sampleDepth,
} from '../model/01-depth/renderer.js';

// Wave rendering
export { WAVE_COLORS, getWaveColors, renderWave, renderWaves } from './waveRenderer.js';

// Foam rendering (marching squares)
export {
  buildIntensityGrid,
  buildIntensityGridOptionA,
  boxBlur,
  extractLineSegments,
  renderMultiContour,
  renderMultiContourOptionA,
  renderMultiContourOptionB,
  renderMultiContourOptionC,
  renderMultiContourFromGrid,
  renderMultiContourOptionAFromGrid,
  renderMultiContourOptionBFromGrid,
  renderMultiContourOptionCFromGrid,
} from './marchingSquares.js';

// Coordinate utilities
export {
  progressToScreenY,
  screenYToProgress,
  getOceanBounds,
  calculateTravelDuration,
} from './coordinates.js';
