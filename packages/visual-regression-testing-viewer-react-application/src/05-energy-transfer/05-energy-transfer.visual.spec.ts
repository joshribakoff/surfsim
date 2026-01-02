import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_SINGLE_BREAK } from '@surf/core/src/layers/06-energy-transfer/stories/01-breaking-release';
import { PROGRESSION_NO_BLUR } from '@surf/core/src/layers/06-energy-transfer/stories/02-spatial-spread';

defineStoryVisualTests('06-energy-transfer', [
  ['01-breaking-release', { id: PROGRESSION_SINGLE_BREAK.id }],
  ['02-spatial-spread', { id: PROGRESSION_NO_BLUR.id }],
]);
