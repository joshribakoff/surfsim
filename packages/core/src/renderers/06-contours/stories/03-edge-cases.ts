import { createMatrix, toProgression, progressionsToStrip } from '../shared';

export const PROGRESSION_EMPTY = toProgression(
  'foam-contours/empty',
  'Empty',
  'No foam data present',
  () => createMatrix()
);

export const PROGRESSION_FULL = toProgression(
  'foam-contours/full',
  'Full Saturation',
  'All cells saturated above contour thresholds',
  () => {
    const matrix = createMatrix();
    matrix.fill(0.9);
    return matrix;
  }
);

export const FOAM_STRIP_EDGE_CASES = {
  testId: 'strip-foam-edge-cases',
  pageId: '09-foam-contours/03-edge-cases',
  snapshots: progressionsToStrip([
    { progression: PROGRESSION_EMPTY },
    { progression: PROGRESSION_FULL },
  ]),
};
