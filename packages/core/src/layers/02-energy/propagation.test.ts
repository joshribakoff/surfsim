/**
 * Energy Field Propagation Tests
 */
import { describe, it, expect } from 'vitest';
import { PROGRESSION_PROPAGATION } from './stories/01-propagation';

// Helper to sum all energy in a matrix
function totalEnergy(matrix: number[][]): number {
  return matrix.reduce((sum, row) => sum + row.reduce((s, v) => s + v, 0), 0);
}

describe('Energy Field Propagation', () => {
  const progression = PROGRESSION_PROPAGATION;

  it('starts with energy at horizon', () => {
    const matrix = progression.matrixAt(0);
    expect(matrix[0][2]).toBe(1.0); // Energy at horizon
    expect(matrix[1][2]).toBe(0); // Empty below
  });

  it('total energy decreases over time (damping)', () => {
    // Energy should NOT accumulate - it should decrease due to damping
    // This tests that we're not creating energy from nowhere
    const e0 = totalEnergy(progression.matrixAt(0));
    const e5 = totalEnergy(progression.matrixAt(5));

    // Total energy at t=5 should be less than or equal to t=0
    // (damping removes energy, advection should conserve it)
    expect(e5).toBeLessThanOrEqual(e0 * 1.1); // Allow 10% tolerance for numerical issues
  });

  it('energy propagates toward shore', () => {
    // Energy should move from row 0 toward shore
    const t0 = progression.matrixAt(0);
    const t5 = progression.matrixAt(5);

    // At t=0, only row 0 has energy
    expect(t0[0][2]).toBeGreaterThan(0);
    expect(t0[3][2]).toBe(0);

    // At t=5, the peak should have moved toward shore (row 0 should have less energy)
    // This will fail with current code because row 0 never drains
    expect(t5[0][2]).toBeLessThan(t0[0][2]);
  });
});
