import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_PROPAGATION } from '@surf/core/src/layers/02-energy/stories/01-propagation';

defineStoryVisualTests('02-energy', [['01-propagation', { id: PROGRESSION_PROPAGATION.id }]]);
