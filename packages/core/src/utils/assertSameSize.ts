/**
 * Assert two Float32Arrays have the same length.
 * Used by all layers to ensure field dimensions match.
 */
export function assertSameSize(a: Float32Array, b: Float32Array, context: string): void {
  if (a.length !== b.length) {
    throw new Error(`Layer size mismatch in ${context}: ${a.length} vs ${b.length}`);
  }
}
