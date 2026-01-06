// Depth Heat Map Renderer (Plan 130)
// Renders ocean floor depth as a color-coded heat map
// Uses caching for performance - builds once, blits each frame

import { viridisToRgb } from '../../render/colorScales';

/**
 * Sample depth from Float32Array at normalized coordinates
 */
export function sampleDepth(
  depthData: Float32Array,
  gridWidth: number,
  gridHeight: number,
  normalizedX: number,
  normalizedY: number
): number {
  const x = Math.min(gridWidth - 1, Math.max(0, Math.floor(normalizedX * gridWidth)));
  const y = Math.min(gridHeight - 1, Math.max(0, Math.floor(normalizedY * gridHeight)));
  return depthData[y * gridWidth + x];
}

/**
 * Build depth heat map to an offscreen canvas
 * @param width - Canvas width in pixels
 * @param oceanTop - Y coordinate of ocean top (horizon)
 * @param oceanBottom - Y coordinate of ocean bottom (shore line)
 * @param depthData - Pre-computed depth Float32Array
 * @param gridWidth - Depth grid width
 * @param gridHeight - Depth grid height
 * @param options - Rendering options
 */
export function buildBathymetryCache(
  width: number,
  oceanTop: number,
  oceanBottom: number,
  depthData: Float32Array,
  gridWidth: number,
  gridHeight: number,
  options: { stepX?: number; stepY?: number } = {}
) {
  const { stepX = 4, stepY = 4 } = options;
  const colorScaleDepth = Math.max(...depthData) || 1;

  const cache = document.createElement('canvas');
  cache.width = width;
  cache.height = oceanBottom;
  const cacheCtx = cache.getContext('2d');

  for (let y = oceanTop; y < oceanBottom; y += stepY) {
    const normalizedY = (y - oceanTop) / (oceanBottom - oceanTop);
    for (let x = 0; x < width; x += stepX) {
      const normalizedX = x / width;
      const depth = sampleDepth(depthData, gridWidth, gridHeight, normalizedX, normalizedY);
      const { r, g, b } = depthToColor(depth, colorScaleDepth);
      cacheCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      cacheCtx.fillRect(x, y, stepX, stepY);
    }
  }

  return cache;
}

/**
 * Convert depth value to RGB color using inverted Viridis scale
 * Inverted: shallow (low depth) = yellow (bright), deep = purple (dark)
 * @param depth - Water depth in meters
 * @param colorScaleDepth - Depth at which color saturates
 */
export function depthToColor(
  depth: number,
  colorScaleDepth: number
): { r: number; g: number; b: number } {
  // Use sqrt for non-linear scaling - shows shallow areas more distinctly
  const depthRatio = Math.min(1, Math.sqrt(depth / colorScaleDepth));
  // Inverted Viridis: shallow = yellow (bright), deep = purple (dark)
  return viridisToRgb(1 - depthRatio);
}

/**
 * Create a cache manager for depth heatmap rendering
 * Handles cache invalidation on resize
 */
export function createBathymetryCacheManager() {
  let cache: HTMLCanvasElement | null = null;
  let cachedWidth = 0;
  let cachedHeight = 0;

  return {
    /**
     * Get or build the depth heatmap cache
     */
    get(
      width: number,
      oceanTop: number,
      oceanBottom: number,
      depthData: Float32Array,
      gridWidth: number,
      gridHeight: number,
      options: { stepX?: number; stepY?: number } = {}
    ) {
      if (!cache || cachedWidth !== width || cachedHeight !== oceanBottom) {
        cache = buildBathymetryCache(
          width,
          oceanTop,
          oceanBottom,
          depthData,
          gridWidth,
          gridHeight,
          options
        );
        cachedWidth = width;
        cachedHeight = oceanBottom;
      }
      return cache;
    },

    /** Invalidate the cache (call on resize) */
    invalidate() {
      cache = null;
      cachedWidth = 0;
      cachedHeight = 0;
    },

    /** Check if cache is valid for given dimensions */
    isValid(width: number, height: number) {
      return cache !== null && cachedWidth === width && cachedHeight === height;
    },
  };
}
