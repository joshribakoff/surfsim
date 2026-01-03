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
      "FFFFFFFF
      EEFFFFEE
      DDFFFFDD
      CCFFFFCC
      BBDDDDBB
      44CCCC44
      33AAAA33
      22333322
      11222211
      --------"
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
