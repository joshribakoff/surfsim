import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_NO_DAMPING } from '@surf/core/src/layers/03-energy-field/stories/01-no-damping';
import { PROGRESSION_LOW_DAMPING } from '@surf/core/src/layers/03-energy-field/stories/02-low-damping';
import { PROGRESSION_HIGH_DAMPING } from '@surf/core/src/layers/03-energy-field/stories/03-high-damping';
import { PROGRESSION_WITH_DRAIN } from '@surf/core/src/layers/03-energy-field/stories/04-with-drain';

defineStoryVisualTests('03-energy-field', [
  ['01-no-damping', { id: PROGRESSION_NO_DAMPING.id }],
  ['02-low-damping', { id: PROGRESSION_LOW_DAMPING.id }],
  ['03-high-damping', { id: PROGRESSION_HIGH_DAMPING.id }],
  ['04-with-drain', { id: PROGRESSION_WITH_DRAIN.id }],
]);
