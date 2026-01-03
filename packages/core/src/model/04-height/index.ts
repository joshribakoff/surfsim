// Public API for Layer 04: Height
// Wave surface elevation (shoaling)

export {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  createHeightField,
  computeHeight,
  updateHeightField,
  getHeightAt,
} from './model';

export type { HeightField } from './model';

// Legacy shared utilities
export { GRID_WIDTH, GRID_HEIGHT, createMatrix } from './shared';
export type { Matrix } from './shared';

// Story exports (consolidated)
export { default as shoalingStory, PROGRESSION_SHOALING } from './stories/01-shoaling';
