import { defineStoryVisualTests } from '../visual-test-helpers';
import { PROGRESSION_FOAM } from '@surf/core/src/model/05-foam';

defineStoryVisualTests('05-foam', [['01-foam-dynamics', { id: PROGRESSION_FOAM.id }]]);
