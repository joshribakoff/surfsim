// Energy Field Renderer
// Canonical renderer for Layer 02 energy visualization
// Uses Viridis color scale - perceptually uniform, colorblind-friendly
//
// IMPORTANT: Energy values are normalized before mapping to color.
// The color scale only knows about 0-1, not game-specific energy units.

import { viridisToColor, viridisToRgb } from '../../render/colorScales';

/** Default energy range for normalization */
export const DEFAULT_ENERGY_MIN = 0;
export const DEFAULT_ENERGY_MAX = 2.0; // Accounts for wave overlap accumulation

/**
 * Normalize a value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export interface EnergyRenderOptions {
  /** Minimum energy value (maps to purple/0) */
  energyMin?: number;
  /** Maximum energy value (maps to yellow/1) */
  energyMax?: number;
}

/**
 * Render energy field to canvas (game context)
 * Renders solid Viridis heatmap covering the ocean area
 *
 * @param ctx - Canvas 2D context
 * @param field - Energy field { height: Float32Array, width: number, gridHeight: number }
 * @param oceanTop - Y pixel position of horizon
 * @param oceanBottom - Y pixel position of shore
 * @param canvasWidth - Canvas width in pixels
 * @param options - Normalization options { energyMin, energyMax }
 */
export function renderEnergyField(
  ctx: CanvasRenderingContext2D,
  field: { height: Float32Array; width: number; gridHeight: number },
  oceanTop: number,
  oceanBottom: number,
  canvasWidth: number,
  options: EnergyRenderOptions = {}
): void {
  const { height, width, gridHeight } = field;
  const { energyMin = DEFAULT_ENERGY_MIN, energyMax = DEFAULT_ENERGY_MAX } = options;

  const cellW = canvasWidth / width;
  const cellH = (oceanBottom - oceanTop) / gridHeight;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < width; x++) {
      const energy = height[y * width + x];
      const normalized = normalize(energy, energyMin, energyMax);
      ctx.fillStyle = viridisToColor(normalized);
      ctx.fillRect(x * cellW, oceanTop + y * cellH, cellW + 1, cellH + 1);
    }
  }
}

/**
 * Render energy matrix to canvas (story viewer context)
 * Simple cell-by-cell rendering for progression snapshots
 *
 * @param ctx - Canvas 2D context
 * @param matrix - Float32Array of energy values
 * @param matrixWidth - Number of columns
 * @param matrixHeight - Number of rows
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param options - Normalization options { energyMin, energyMax }
 */
export function renderEnergyMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: Float32Array,
  matrixWidth: number,
  matrixHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  options: EnergyRenderOptions = {}
): void {
  const { energyMin = DEFAULT_ENERGY_MIN, energyMax = DEFAULT_ENERGY_MAX } = options;
  const cellW = canvasWidth / matrixWidth;
  const cellH = canvasHeight / matrixHeight;

  for (let row = 0; row < matrixHeight; row++) {
    for (let col = 0; col < matrixWidth; col++) {
      const energy = matrix[row * matrixWidth + col];
      const normalized = normalize(energy, energyMin, energyMax);
      ctx.fillStyle = viridisToColor(normalized);
      ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
    }
  }
}

/**
 * High-performance energy field renderer using ImageData
 * Renders pixel-by-pixel for smooth gradients at any resolution
 *
 * @param ctx - Canvas 2D context
 * @param field - Energy field { height: Float32Array, width: number, gridHeight: number }
 * @param oceanTop - Y pixel position of horizon
 * @param oceanBottom - Y pixel position of shore
 * @param canvasWidth - Canvas width in pixels
 * @param options - Normalization options { energyMin, energyMax }
 */
export function renderEnergyFieldFast(
  ctx: CanvasRenderingContext2D,
  field: { height: Float32Array; width: number; gridHeight: number },
  oceanTop: number,
  oceanBottom: number,
  canvasWidth: number,
  options: EnergyRenderOptions = {}
): void {
  const { height, width, gridHeight } = field;
  const { energyMin = DEFAULT_ENERGY_MIN, energyMax = DEFAULT_ENERGY_MAX } = options;

  const pixelWidth = Math.ceil(canvasWidth);
  const pixelHeight = Math.ceil(oceanBottom - oceanTop);

  const imageData = ctx.createImageData(pixelWidth, pixelHeight);
  const data = imageData.data;

  for (let py = 0; py < pixelHeight; py++) {
    for (let px = 0; px < pixelWidth; px++) {
      const gx = Math.floor((px / pixelWidth) * width);
      const gy = Math.floor((py / pixelHeight) * gridHeight);
      const energy = height[gy * width + gx];
      const normalized = normalize(energy, energyMin, energyMax);

      const { r, g, b } = viridisToRgb(normalized);

      const idx = (py * pixelWidth + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, oceanTop);
}
