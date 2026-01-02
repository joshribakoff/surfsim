import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_ACCUMULATION } from '@surf/core/src/layers/07-foam-grid/stories/01-accumulation';
import { PROGRESSION_ADVECTION } from '@surf/core/src/layers/07-foam-grid/stories/02-advection';
import { PROGRESSION_COMBINED } from '@surf/core/src/layers/07-foam-grid/stories/03-combined';

defineStoryVisualTests('07-foam-grid', [
  ['01-accumulation', { id: PROGRESSION_ACCUMULATION.id }],
  ['02-advection', { id: PROGRESSION_ADVECTION.id }],
  ['03-combined', { id: PROGRESSION_COMBINED.id }],
]);
