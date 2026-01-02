/**
 * Bathymetry Progressions Tests
 *
 * Tests validate the depth matrix data for the consolidated bathymetry story.
 */
import { describe, it, expect } from 'vitest';
import { matrixToAscii } from '../../test-utils';
import { PROGRESSION_BATHYMETRY } from './stories/01-bathymetry';

describe('Bathymetry Progression', () => {
  it('beach with channel shows lateral depth variation', () => {
    const matrix = PROGRESSION_BATHYMETRY.snapshots[0].matrix;
    expect(matrixToAscii(matrix)).toMatchInlineSnapshot(`
      "FFDFFFDF
      EECFFFCE
      DDBFFFBD
      CCAFFFAC
      BB4EEE4B
      442CCC24
      331BBB13
      22-AAA-2
      11-444-1
      ---333--"
    `);
  });

  it('has correct metadata', () => {
    expect(PROGRESSION_BATHYMETRY.id).toBe('bathymetry/beach');
    expect(PROGRESSION_BATHYMETRY.metadata?.label).toBe('Beach with Channel');
  });

  it('has 8x10 grid', () => {
    const matrix = PROGRESSION_BATHYMETRY.snapshots[0].matrix;
    expect(matrix.length).toBe(10);
    expect(matrix[0].length).toBe(8);
  });
});
