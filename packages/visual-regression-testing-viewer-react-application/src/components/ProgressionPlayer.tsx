import React, { useState, useEffect, useRef } from 'react';
import { renderEnergyMatrix } from '@surf/core/src/model/02-energy/renderer';
import { useTheme } from '../ThemeContext';

interface Snapshot {
  time: number;
  matrix: Float32Array;
  width: number;
  height: number;
  label: string;
}

interface ProgressionPlayerProps {
  snapshots: Snapshot[];
  cellSize?: number;
  frameDelay?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

function MatrixCanvas({
  matrix,
  matrixWidth,
  matrixHeight,
  cellSize = 24,
}: {
  matrix: Float32Array;
  matrixWidth: number;
  matrixHeight: number;
  cellSize?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Auto-scale: find max value in matrix for this frame
    const maxValue = Math.max(...matrix) || 1;
    renderEnergyMatrix(ctx, matrix, matrixWidth, matrixHeight, canvas.width, canvas.height, {
      scaleMax: maxValue,
    });
  }, [matrix, cellSize, matrixWidth, matrixHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={matrixWidth * cellSize}
      height={matrixHeight * cellSize}
      style={{ borderRadius: 4 }}
    />
  );
}

export function ProgressionPlayer({
  snapshots,
  cellSize = 24,
  frameDelay = 500,
  autoPlay = true,
  loop = true,
}: ProgressionPlayerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const { colors } = useTheme();

  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setFrameIndex((i) => {
        const next = i + 1;
        if (next >= snapshots.length) {
          if (loop) return 0;
          setPlaying(false);
          return i;
        }
        return next;
      });
    }, frameDelay / speed);

    return () => clearInterval(interval);
  }, [playing, speed, frameDelay, loop, snapshots.length]);

  const snapshot = snapshots[frameIndex];
  if (!snapshot) return null;

  return (
    <div
      style={{
        display: 'inline-block',
        background: colors.bgSection,
        padding: 16,
        borderRadius: 8,
        margin: '1em 0',
        border: `1px solid ${colors.border}`,
      }}
    >
      <MatrixCanvas
        matrix={snapshot.matrix}
        matrixWidth={snapshot.width}
        matrixHeight={snapshot.height}
        cellSize={cellSize}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 12,
          fontSize: 14,
        }}
      >
        <button
          onClick={() => setPlaying(!playing)}
          style={{
            background: colors.buttonBg,
            border: `1px solid ${colors.buttonBorder}`,
            color: colors.text,
            padding: '6px 12px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {playing ? '⏸' : '▶️'}
        </button>
        <span style={{ color: colors.accent, minWidth: 80 }}>{snapshot.label}</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{
            background: colors.buttonBg,
            border: `1px solid ${colors.buttonBorder}`,
            color: colors.text,
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
        </select>
        <input
          type="range"
          min={0}
          max={snapshots.length - 1}
          value={frameIndex}
          onChange={(e) => {
            setFrameIndex(Number(e.target.value));
            setPlaying(false);
          }}
          style={{ flex: 1, cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}
