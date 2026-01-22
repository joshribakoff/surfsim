// AI Player Integration Test
// Tests AI behavior using the same setup as the real game

import { describe, it, expect } from 'vitest';
import { createAIState, updateAIPlayer, AI_MODE, AI_STATE } from './aiPlayerModel.js';
// Note: AI_STATE.SEEKING replaces PADDLE_OUT, AI starts by actively looking for foam
import { createPlayerProxy, updatePlayerProxy } from '@surf/core/src/state/playerProxyModel.js';
import { createDepthData } from '@surf/core/src/model/01-depth/model.js';
import { getOceanBounds, calculateTravelDuration } from '@surf/core/src/render/coordinates.js';
import { createFoamGrids } from '@surf/core/src/state/foamGridModel.js';

// Test depth data
const TEST_WIDTH = 60;
const TEST_HEIGHT = 40;
const testDepth = createDepthData(TEST_WIDTH, TEST_HEIGHT);

// Simulate real game dimensions
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 700;
const SHORE_HEIGHT = 100;

// Get bounds exactly like the real game does
const { oceanTop, oceanBottom, shoreY } = getOceanBounds(CANVAS_HEIGHT, SHORE_HEIGHT);
const TRAVEL_DURATION = calculateTravelDuration(oceanBottom, 50); // 50 px/s wave speed

// Peak is center of screen (where channel is in simple depth model)
const PEAK_X_NORM = 0.5;

function createFoamGridBand(yNorm, startXNorm, endXNorm, intensity = 0.5) {
  const { foam } = createFoamGrids();
  const row = Math.min(foam.height - 1, Math.max(0, Math.floor(yNorm * (foam.height - 1))));
  const start = Math.min(foam.width - 1, Math.max(0, Math.floor(startXNorm * (foam.width - 1))));
  const end = Math.min(foam.width - 1, Math.max(start, Math.floor(endXNorm * (foam.width - 1))));
  for (let x = start; x <= end; x++) {
    foam.data[row * foam.width + x] = intensity;
  }
  return foam;
}

describe('AI Player Integration', () => {
  it('logs real game dimensions', () => {
    console.log('=== REAL GAME DIMENSIONS ===');
    console.log(`Canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);
    console.log(`Ocean: top=${oceanTop}, bottom=${oceanBottom} (height=${oceanBottom - oceanTop})`);
    console.log(`Shore: Y=${shoreY}, height=${SHORE_HEIGHT}`);
    console.log(`Travel duration: ${TRAVEL_DURATION}ms`);
    console.log(`Peak X: ${PEAK_X_NORM} = ${PEAK_X_NORM * CANVAS_WIDTH}px`);

    const expertTarget = 0.58 * (oceanBottom - oceanTop) + oceanTop;
    console.log(`Expert target Y (0.58 progress): ${expertTarget}px`);

    expect(true).toBe(true);
  });

  it('AI paddles from spawn to target position', () => {
    // Create player at spawn position (on shore)
    let player = createPlayerProxy(CANVAS_WIDTH, shoreY);
    const aiState = createAIState(AI_MODE.EXPERT);

    // Create foam that will reach the player at the target position
    const foamY = 0.58 * (oceanBottom - oceanTop) + oceanTop;

    const foamGrid = createFoamGridBand(
      (foamY - oceanTop) / (oceanBottom - oceanTop),
      PEAK_X_NORM - 0.15,
      PEAK_X_NORM + 0.15,
      0.5
    );
    const world = {
      waves: [],
      foamGrid,
      gameTime: 0,
      depth: testDepth,
      depthWidth: TEST_WIDTH,
      depthHeight: TEST_HEIGHT,
    };

    console.log('=== AI PADDLE TEST ===');
    console.log(`Player spawn: (${player.x}, ${player.y})`);

    const peakX = PEAK_X_NORM * CANVAS_WIDTH;
    const targetLineup = aiState.config.minProgress;
    const targetY = oceanTop + (oceanBottom - oceanTop) * targetLineup;
    console.log(`Target position: (${peakX}, ${targetY})`);

    // Simulate 10 seconds of game time at 60fps
    const dt = 1 / 60;
    const frames = 60 * 10;

    let lastLogFrame = 0;
    for (let frame = 0; frame < frames; frame++) {
      world.gameTime = frame * dt * 1000;

      const input = updateAIPlayer(
        player,
        aiState,
        world,
        dt,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        oceanTop,
        oceanBottom,
        TRAVEL_DURATION
      );

      player = updatePlayerProxy(
        player,
        dt,
        input,
        world.foamGrid,
        shoreY,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        oceanTop,
        oceanBottom
      );

      if (frame - lastLogFrame >= 120) {
        lastLogFrame = frame;
        const dx = peakX - player.x;
        const dy = targetY - player.y;
        console.log(
          `Frame ${frame}: pos=(${Math.round(player.x)},${Math.round(player.y)}) dx=${Math.round(dx)} dy=${Math.round(dy)}`
        );
      }
    }

    console.log(`Final position: (${Math.round(player.x)}, ${Math.round(player.y)})`);

    expect(player.y).toBeLessThan(shoreY);

    const minY = oceanTop + (oceanBottom - oceanTop) * aiState.config.minProgress;
    const maxY = oceanTop + (oceanBottom - oceanTop) * aiState.config.maxProgress;
    expect(player.y).toBeGreaterThanOrEqual(minY - 50);
    expect(player.y).toBeLessThanOrEqual(maxY + 50);
  });

  it('AI catches wave when foam reaches them at target position', () => {
    const aiState = createAIState(AI_MODE.EXPERT);
    const peakX = PEAK_X_NORM * CANVAS_WIDTH;
    const targetY =
      oceanTop +
      (oceanBottom - oceanTop) * ((aiState.config.minProgress + aiState.config.maxProgress) / 2);

    let player = { x: peakX, y: targetY, vx: 0, vy: 0 };

    console.log('=== WAVE CATCH CYCLE TEST ===');
    console.log(`Player at target: (${player.x}, ${player.y})`);

    const foamGrid = createFoamGridBand(
      (player.y - oceanTop) / (oceanBottom - oceanTop),
      PEAK_X_NORM - 0.15,
      PEAK_X_NORM + 0.15,
      0.5
    );
    const world = {
      waves: [],
      foamGrid,
      gameTime: 0,
      depth: testDepth,
      depthWidth: TEST_WIDTH,
      depthHeight: TEST_HEIGHT,
    };

    for (let attempt = 0; attempt < 10; attempt++) {
      aiState.state = AI_STATE.SEEKING;
      updateAIPlayer(
        player,
        aiState,
        world,
        1 / 60,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        oceanTop,
        oceanBottom,
        TRAVEL_DURATION
      );
      if (aiState.state === AI_STATE.RIDING) break;
    }

    expect(aiState.state).toBe(AI_STATE.RIDING);
    console.log(`Caught wave, now riding direction: ${aiState.rideDirection}`);

    const dt = 1 / 60;
    for (let frame = 0; frame < 120; frame++) {
      world.gameTime = frame * dt * 1000;
      const input = updateAIPlayer(
        player,
        aiState,
        world,
        dt,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        oceanTop,
        oceanBottom,
        TRAVEL_DURATION
      );
      player = updatePlayerProxy(
        player,
        dt,
        input,
        world.foamGrid,
        shoreY,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        oceanTop,
        oceanBottom
      );
    }

    console.log(
      `After 2s ride: pos=(${Math.round(player.x)}, ${Math.round(player.y)}), state=${aiState.state}`
    );

    expect(aiState.state).toBe(AI_STATE.RIDING);

    world.foamGrid = createFoamGridBand(0.1, 0, 0, 0);
    aiState.rideTimer = 1.0;

    updateAIPlayer(
      player,
      aiState,
      world,
      dt,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      oceanTop,
      oceanBottom,
      TRAVEL_DURATION
    );

    console.log(`After foam ends: state=${aiState.state}`);
    expect(aiState.state).toBe(AI_STATE.SEEKING);
  });

  it('AI reaches target and catches foam', () => {
    const aiState = createAIState(AI_MODE.EXPERT);
    const peakX = PEAK_X_NORM * CANVAS_WIDTH;
    const targetY = oceanTop + (oceanBottom - oceanTop) * 0.7;

    let player = { x: peakX, y: targetY, vx: 0, vy: 0 };

    console.log('=== FOAM CATCH TEST ===');
    console.log(`Player at target: (${player.x}, ${player.y})`);

    const foamGrid = createFoamGridBand(
      (targetY - oceanTop) / (oceanBottom - oceanTop),
      PEAK_X_NORM - 0.1,
      PEAK_X_NORM + 0.1,
      0.5
    );
    const world = {
      waves: [],
      foamGrid,
      gameTime: 100,
      depth: testDepth,
      depthWidth: TEST_WIDTH,
      depthHeight: TEST_HEIGHT,
    };

    for (let attempt = 0; attempt < 10; attempt++) {
      aiState.state = AI_STATE.SEEKING;
      updateAIPlayer(
        player,
        aiState,
        world,
        1 / 60,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        oceanTop,
        oceanBottom,
        TRAVEL_DURATION
      );
      if (aiState.state === AI_STATE.RIDING) break;
    }

    console.log(`AI state after foam: ${aiState.state}`);
    console.log(`Waves caught: ${aiState.stats.wavesCaught}`);

    expect(aiState.state).toBe(AI_STATE.RIDING);
  });

  it('verifies coordinate system', () => {
    const aiState = createAIState(AI_MODE.EXPERT);

    console.log('=== COORDINATE SYSTEM ===');
    console.log('Y=0 is at TOP of screen (horizon)');
    console.log(`Y=${oceanBottom} is at BOTTOM of ocean (shore line)`);
    console.log(`Y=${shoreY} is where shore starts`);
    console.log('');
    console.log('Progress 0.0 = horizon (Y=0)');
    console.log('Progress 1.0 = shore (Y=oceanBottom)');
    console.log(
      `Expert zone: ${aiState.config.minProgress}-${aiState.config.maxProgress} progress`
    );
    console.log(
      `Expert zone Y: ${aiState.config.minProgress * oceanBottom}-${aiState.config.maxProgress * oceanBottom}px`
    );

    // Expert should be in the deeper water area
    expect(aiState.config.minProgress).toBeGreaterThanOrEqual(0.5);
  });
});
