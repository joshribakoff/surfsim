import { defineStoryVisualTests } from '../visual-test-helpers';
import energyStory from '@surf/core/src/model/02-energy/stories/02-energy';

defineStoryVisualTests('02-energy', [['02-energy', { id: energyStory.progression.id }]]);
