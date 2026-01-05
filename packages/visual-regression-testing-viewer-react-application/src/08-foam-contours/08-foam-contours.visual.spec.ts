import { defineStoryVisualTests } from '../visual-test-helpers';

// IDs match the file path structure: layerPrefix/storyFileName -> 06-contours/XX-name
defineStoryVisualTests('06-contours', [
  ['01-basic-shapes', { id: '06-contours/01-basic-shapes' }],
  ['02-advanced-patterns', { id: '06-contours/02-advanced-patterns' }],
  ['03-edge-cases', { id: '06-contours/03-edge-cases' }],
]);
