import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_INTENSITY_DECAY } from '@surf/core/src/layers/08-foam-dispersion/stories/01-decay-rate';
import { PROGRESSION_SPATIAL_SPREADING } from '@surf/core/src/layers/08-foam-dispersion/stories/02-spatial-spreading';
import { PROGRESSION_DECAY_AND_SPREAD } from '@surf/core/src/layers/08-foam-dispersion/stories/03-combined';

defineStoryVisualTests('08-foam-dispersion', [
  ['01-decay-rate', { id: PROGRESSION_INTENSITY_DECAY.id }],
  ['02-spatial-spreading', { id: PROGRESSION_SPATIAL_SPREADING.id }],
  ['03-combined', { id: PROGRESSION_DECAY_AND_SPREAD.id }],
]);
