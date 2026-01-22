/**
 * Strip Test Utilities
 *
 * Helper for creating strip definitions used by visual regression tests.
 * Strips are filmstrip-like sequences of matrix snapshots rendered to canvas.
 */

/**
 * Snapshot with Float32Array matrix and dimensions
 */
type Snapshot = {
  time: number;
  matrix: Float32Array;
  width: number;
  height: number;
  label: string;
};

/**
 * Strip definition for visual tests
 */
export type StripDefinition = {
  testId: string;
  pageId: string;
  snapshots: Snapshot[];
};

/**
 * Progression type from defineProgression
 */
type Progression = {
  id: string;
  snapshots: Snapshot[];
};

/**
 * Create a strip definition from a progression.
 */
export function createStrip(
  progression: Progression,
  pageId: string,
  testIdPrefix = 'strip'
): StripDefinition {
  const idSlug = progression.id.replace(/\//g, '-');
  const testId = `${testIdPrefix}-${idSlug}`;

  return {
    testId,
    pageId,
    snapshots: progression.snapshots,
  };
}
