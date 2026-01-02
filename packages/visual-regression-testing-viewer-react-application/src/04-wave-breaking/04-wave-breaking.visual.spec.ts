import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_BREAKING_CRITERION } from '@surf/core/src/layers/05-wave-breaking/stories/01-breaking-criterion';
import { PROGRESSION_SPILLING } from '@surf/core/src/layers/05-wave-breaking/stories/02-breaking-types';
import { PROGRESSION_ENERGY_TO_FOAM } from '@surf/core/src/layers/05-wave-breaking/stories/03-energy-to-foam';

defineStoryVisualTests('05-wave-breaking', [
  ['01-breaking-criterion', { id: PROGRESSION_BREAKING_CRITERION.id }],
  ['02-breaking-types', { id: PROGRESSION_SPILLING.id }],
  ['03-energy-to-foam', { id: PROGRESSION_ENERGY_TO_FOAM.id }],
]);
