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

/** Custom render function signature for stories */
export type StoryRenderFn = (
  snapshot: { matrix: Float32Array; width: number; height: number; label: string },
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => void;

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
  updateFn?: (field: any, prevTime: number, currTime: number) => void;
  expectedAscii: string;
  /** Custom render function (overrides default heatmap) */
  renderFn?: StoryRenderFn;
}

export interface Story {
  id?: string;
  title: string;
  prose: string;
  progression: ReturnType<typeof defineProgression>;
  /** Custom render function (overrides default heatmap in viewer) */
  renderFn?: StoryRenderFn;
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
    renderFn,
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

  return { title, prose, progression, renderFn };
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
