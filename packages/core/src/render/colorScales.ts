/**
 * Perceptually Uniform Color Scales for Data Visualization
 *
 * Uses scale-color-perceptual for accurate Viridis colors from matplotlib.
 * Standard heatmap convention: low values = purple, high values = yellow.
 */

import viridis from 'scale-color-perceptual/viridis';

/**
 * Map a scalar value (0-1) to Viridis RGB color
 * 0 = purple (low/cold), 1 = yellow (high/hot)
 */
export function viridisToRgb(scalar: number): { r: number; g: number; b: number } {
  const clamped = Math.max(0, Math.min(1, scalar));
  const hex = viridis(clamped);
  // Parse hex string "#rrggbb" to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/**
 * Map a scalar value (0-1) to Viridis CSS color string
 * 0 = purple (low/cold), 1 = yellow (high/hot)
 */
export function viridisToColor(scalar: number): string {
  const clamped = Math.max(0, Math.min(1, scalar));
  return viridis(clamped);
}

/**
 * Map energy value to color for heatmap visualization
 * 0 = purple, 1 = yellow (standard heatmap convention)
 */
export function energyToColor(energy: number): string {
  return viridisToColor(energy);
}
