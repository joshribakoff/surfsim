/**
 * ASCII Matrix Format for Compact Energy Field Snapshots
 *
 * Inspired by RxJS marble testing, this provides a human-readable
 * format for energy field matrices that's easy to diff and understand.
 *
 * Format:
 *   - Each character represents a cell value (0.0 - 1.0)
 *   - Characters: - 0 1 2 3 4 5 6 7 8 9 A B C D E F
 *   - '-' = 0.0 (or values < 0.05)
 *   - '0'-'9' = 0.0-0.9 in 0.1 increments
 *   - 'A'-'F' = 0.95-1.0 (A=0.95, F=1.0)
 *   - Each row is a string of characters
 *   - Rows are separated by newlines
 *
 * Example (6x5 matrix):
 *   FFFFF
 *   -----
 *   -----
 *   -----
 *   -----
 *   -----
 *
 * This represents energy=1.0 at horizon (row 0), 0.0 everywhere else.
 */

/**
 * Convert a numeric value (0.0-1.0) to a single ASCII character
 */
export function valueToChar(value: number): string {
  if (value < 0.05) return '-';
  if (value >= 0.95) return 'F';
  if (value >= 0.85) return 'E';
  if (value >= 0.75) return 'D';
  if (value >= 0.65) return 'C';
  if (value >= 0.55) return 'B';
  if (value >= 0.45) return 'A';
  // 0.05 - 0.45 maps to '1' - '4'
  // Round to nearest 0.1
  const digit = Math.round(value * 10);
  return digit.toString();
}

/**
 * Convert an ASCII character back to a numeric value
 */
export function charToValue(char: string): number {
  if (char === '-') return 0;
  if (char === 'F') return 1.0;
  if (char === 'E') return 0.9;
  if (char === 'D') return 0.8;
  if (char === 'C') return 0.7;
  if (char === 'B') return 0.6;
  if (char === 'A') return 0.5;
  const digit = parseInt(char, 10);
  if (!isNaN(digit)) return digit / 10;
  throw new Error(`Invalid ASCII matrix character: '${char}'`);
}

/**
 * Convert a Float32Array to compact ASCII format
 * Automatically scales by max value in data (so max always maps to 'F')
 */
export function matrixToAscii(data: Float32Array, width: number, height: number): string {
  const maxValue = Math.max(...data) || 1;
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += valueToChar(data[y * width + x] / maxValue);
    }
    rows.push(row);
  }
  return rows.join('\n');
}

/**
 * Convert ASCII format back to a Float32Array
 */
export function asciiToMatrix(ascii: string): {
  data: Float32Array;
  width: number;
  height: number;
} {
  const lines = ascii.trim().split('\n');
  const height = lines.length;
  const width = lines[0]?.length ?? 0;
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = charToValue(lines[y][x]);
    }
  }

  return { data, width, height };
}

/**
 * Convert a progression (array of snapshots) to a compact multi-frame ASCII format
 *
 * Output format:
 *   t=0s     t=1s     t=2s
 *   FFFFF    66666    44444
 *   -----    55555    55555
 *   -----    22222    44444
 *   -----    11111    22222
 *   -----    -----    11111
 *   -----    -----    -----
 */
export function progressionToAscii(
  snapshots: Array<{
    time: number;
    matrix: Float32Array;
    width: number;
    height: number;
    label?: string;
  }>
): string {
  if (snapshots.length === 0) return '';

  const { width, height } = snapshots[0];
  const colWidth = width + 2; // +2 for spacing

  // Find max value across all snapshots for auto-scaling
  let maxValue = 0;
  for (const s of snapshots) {
    for (let i = 0; i < s.matrix.length; i++) {
      if (s.matrix[i] > maxValue) maxValue = s.matrix[i];
    }
  }
  if (maxValue === 0) maxValue = 1;

  // Build header row with time labels
  const headers = snapshots.map((s) => {
    const label = s.label || `t=${s.time}s`;
    return label.padEnd(colWidth);
  });
  const headerLine = headers.join('').trimEnd();

  // Build each row across all frames
  const rows: string[] = [];
  for (let r = 0; r < height; r++) {
    const rowParts = snapshots.map((s) => {
      let asciiRow = '';
      for (let c = 0; c < width; c++) {
        asciiRow += valueToChar(s.matrix[r * width + c] / maxValue);
      }
      return asciiRow.padEnd(colWidth);
    });
    rows.push(rowParts.join('').trimEnd());
  }

  return [headerLine, ...rows].join('\n');
}
