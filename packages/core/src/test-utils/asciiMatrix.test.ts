import { describe, it, expect } from 'vitest';
import {
  valueToChar,
  charToValue,
  matrixToAscii,
  asciiToMatrix,
  progressionToAscii,
} from './asciiMatrix.js';

// Helper to create Float32Array from 2D array
function createMatrix(rows: number[][]): { data: Float32Array; width: number; height: number } {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const data = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = rows[y][x];
    }
  }
  return { data, width, height };
}

describe('ASCII Matrix Format', () => {
  describe('valueToChar', () => {
    it('maps 0.0 to -', () => {
      expect(valueToChar(0)).toBe('-');
      expect(valueToChar(0.04)).toBe('-');
    });

    it('maps 1.0 to F', () => {
      expect(valueToChar(1.0)).toBe('F');
      expect(valueToChar(0.95)).toBe('F');
    });

    it('maps intermediate values to digits', () => {
      expect(valueToChar(0.1)).toBe('1');
      expect(valueToChar(0.2)).toBe('2');
      expect(valueToChar(0.3)).toBe('3');
      expect(valueToChar(0.4)).toBe('4');
    });

    it('maps higher values to letters', () => {
      expect(valueToChar(0.5)).toBe('A');
      expect(valueToChar(0.6)).toBe('B');
      expect(valueToChar(0.7)).toBe('C');
      expect(valueToChar(0.8)).toBe('D');
      expect(valueToChar(0.9)).toBe('E');
    });

    it('rounds to nearest bucket', () => {
      expect(valueToChar(0.61)).toBe('B'); // 0.61 -> 0.6 bucket
      expect(valueToChar(0.48)).toBe('A'); // 0.48 -> 0.5 bucket
      expect(valueToChar(0.22)).toBe('2'); // 0.22 -> 0.2 bucket
      expect(valueToChar(0.07)).toBe('1'); // 0.07 -> 0.1 bucket
      expect(valueToChar(0.02)).toBe('-'); // 0.02 -> 0 bucket
    });
  });

  describe('charToValue', () => {
    it('maps - to 0', () => {
      expect(charToValue('-')).toBe(0);
    });

    it('maps F to 1.0', () => {
      expect(charToValue('F')).toBe(1.0);
    });

    it('maps digits to decimals', () => {
      expect(charToValue('1')).toBe(0.1);
      expect(charToValue('2')).toBe(0.2);
      expect(charToValue('5')).toBe(0.5);
    });

    it('maps letters to high values', () => {
      expect(charToValue('A')).toBe(0.5);
      expect(charToValue('B')).toBe(0.6);
      expect(charToValue('C')).toBe(0.7);
      expect(charToValue('D')).toBe(0.8);
      expect(charToValue('E')).toBe(0.9);
    });

    it('throws on invalid character', () => {
      expect(() => charToValue('X')).toThrow();
      expect(() => charToValue(' ')).toThrow();
    });
  });

  describe('matrixToAscii', () => {
    it('converts a simple matrix', () => {
      const { data, width, height } = createMatrix([
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
      ]);
      expect(matrixToAscii(data, width, height)).toBe('FFF\n---');
    });

    it('converts a gradient matrix', () => {
      const { data, width, height } = createMatrix([
        [1.0, 0.8, 0.6],
        [0.4, 0.2, 0.0],
      ]);
      expect(matrixToAscii(data, width, height)).toBe('FDB\n42-');
    });
  });

  describe('asciiToMatrix', () => {
    it('parses a simple matrix', () => {
      const { data, width, height } = asciiToMatrix('FFF\n---');
      expect(width).toBe(3);
      expect(height).toBe(2);
      expect(Array.from(data)).toEqual([1.0, 1.0, 1.0, 0, 0, 0]);
    });

    it('round-trips with matrixToAscii', () => {
      const original = createMatrix([
        [1.0, 0.8, 0.6],
        [0.4, 0.2, 0.0],
      ]);
      const ascii = matrixToAscii(original.data, original.width, original.height);
      const restored = asciiToMatrix(ascii);
      // Values may differ slightly due to bucketing, but chars should match
      expect(matrixToAscii(restored.data, restored.width, restored.height)).toBe(ascii);
    });
  });

  describe('progressionToAscii', () => {
    it('formats multiple frames side by side', () => {
      const m1 = createMatrix([
        [1.0, 1.0, 1.0],
        [0.0, 0.0, 0.0],
      ]);
      const m2 = createMatrix([
        [0.6, 0.6, 0.6],
        [0.4, 0.4, 0.4],
      ]);

      const snapshots = [
        { time: 0, label: 't=0s', matrix: m1.data, width: m1.width, height: m1.height },
        { time: 1, label: 't=1s', matrix: m2.data, width: m2.width, height: m2.height },
      ];

      const ascii = progressionToAscii(snapshots);
      // Should have header + 2 data rows
      const lines = ascii.split('\n');
      expect(lines.length).toBe(3);
      expect(lines[0]).toContain('t=0s');
      expect(lines[0]).toContain('t=1s');
      expect(lines[1]).toContain('FFF');
      expect(lines[1]).toContain('BBB');
      expect(lines[2]).toContain('---');
      expect(lines[2]).toContain('444');
    });
  });
});
