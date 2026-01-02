import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_WAVE_SHOALING } from '@surf/core/src/layers/04-shoaling/stories/01-wave-transformation';
import { PROGRESSION_WAVELENGTH_COMPRESSION } from '@surf/core/src/layers/04-shoaling/stories/02-wavelength-compression';
import { PROGRESSION_ORBITAL_FLATTENING } from '@surf/core/src/layers/04-shoaling/stories/03-speed-vs-depth';
import { PROGRESSION_SHOALING_COMBINED } from '@surf/core/src/layers/04-shoaling/stories/04-combined';

defineStoryVisualTests('04-shoaling', [
  ['01-wave-transformation', { id: PROGRESSION_WAVE_SHOALING.id }],
  ['02-wavelength-compression', { id: PROGRESSION_WAVELENGTH_COMPRESSION.id }],
  ['03-speed-vs-depth', { id: PROGRESSION_ORBITAL_FLATTENING.id }],
  ['04-combined', { id: PROGRESSION_SHOALING_COMBINED.id }],
]);
