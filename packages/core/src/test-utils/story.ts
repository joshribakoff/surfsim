/**
 * Story Definition
 *
 * Single-file story format that combines:
 * - Prose (documentation)
 * - Progression (test data)
 * - Expected ASCII (validated at import time)
 */

import { defineProgression } from './progression.js';
import { progressionToAscii, matrixToAscii } from './asciiMatrix.js';
import { GRID_WIDTH, GRID_HEIGHT } from './matrix.js';

export interface StoryConfig {
  title: string;
  prose: string;
  initialMatrix: Float32Array;
  /** Grid width (default: GRID_WIDTH = 8) */
  width?: number;
  /** Grid height (default: GRID_HEIGHT = 10) */
  height?: number;
  /** Assert the initialMatrix matches this ASCII (catches upstream layer drift) */
  assertInitialAscii?: string;
  captureTimes?: number[];
  updateFn?: (field: any, dt: number) => void;
  expectedAscii: string;
}

export interface Story {
  title: string;
  prose: string;
  progression: ReturnType<typeof defineProgression>;
}

/**
 * Define a story with built-in ASCII validation.
 * Throws at import time if actual output doesn't match expectedAscii.
 */
export function defineStory(config: StoryConfig): Story {
  const {
    title,
    prose,
    initialMatrix,
    width = GRID_WIDTH,
    height = GRID_HEIGHT,
    assertInitialAscii,
    captureTimes = [0, 1, 2, 3, 4, 5],
    updateFn,
    expectedAscii,
  } = config;

  // Validate initial matrix matches assertion (catches upstream layer drift)
  if (assertInitialAscii) {
    const actualInitialAscii = matrixToAscii(initialMatrix, width, height);
    const normalizedExpected = normalizeAscii(assertInitialAscii);
    const normalizedActual = normalizeAscii(actualInitialAscii);

    if (normalizedActual !== normalizedExpected) {
      throw new Error(
        `Story "${title}" initial matrix mismatch (upstream layer may have changed):\n\nExpected:\n${normalizedExpected}\n\nActual:\n${normalizedActual}`
      );
    }
  }

  const progression = defineProgression({
    id: title, // Use title as id for progression registry
    description: prose,
    initialMatrix,
    width,
    height,
    captureTimes,
    updateFn,
    metadata: { label: title },
  });

  // Validate ASCII matches
  const actualAscii = progressionToAscii(progression.snapshots);
  const normalizedExpected = normalizeAscii(expectedAscii);
  const normalizedActual = normalizeAscii(actualAscii);

  if (normalizedActual !== normalizedExpected) {
    throw new Error(
      `Story "${title}" ASCII mismatch:\n\nExpected:\n${normalizedExpected}\n\nActual:\n${normalizedActual}`
    );
  }

  return { title, prose, progression };
}

/**
 * Normalize ASCII for comparison (trim, normalize whitespace)
 */
function normalizeAscii(ascii: string): string {
  return ascii
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}
