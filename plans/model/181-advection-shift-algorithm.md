# Plan: Replace Diffusive Advection with Shift-Based Advection

## Problem

Current advection algorithm is **diffusive**, not advective:
```typescript
// CURRENT: Each cell transfers X% of energy to next cell
const fraction = (velocity * dt) / cellHeight;
transfer = energy * fraction;
```

This causes energy to **spread** (diffuse) rather than **move** as a coherent pulse.

**Evidence**: With damping=0, total energy is conserved but max energy drops rapidly:
- Second 4: total=2238 kJ, max=9.8 kJ, 510 cells
- Second 8: total=2220 kJ, max=4.5 kJ, 1110 cells

Energy spreads across 2x more cells, halving the peak.

## Solution: Time-Derived Integer Shift

Replace percentage-based transfer with array shifting, derived statelessly from game time.

### Core Algorithm

```typescript
function updateEnergyField(field, depthData, dt, gameTime, options) {
  const { velocity, cellHeight } = calculateVelocity(depthData, options);

  // Derive shift from time (stateless - no accumulated state)
  const prevCells = Math.floor((gameTime - dt) * velocity / cellHeight);
  const currCells = Math.floor(gameTime * velocity / cellHeight);
  const shift = currCells - prevCells;

  if (shift > 0) {
    // Shift array down by 'shift' rows (like memmove)
    shiftFieldDown(field, shift);
  }

  // Apply damping separately (after shift, in shallow water only)
  applyDepthDamping(field, depthData, options);
}

function shiftFieldDown(field, rows) {
  const { height, width, gridHeight } = field;

  // Copy from bottom up to avoid overwriting
  for (let y = gridHeight - 1; y >= rows; y--) {
    for (let x = 0; x < width; x++) {
      height[y * width + x] = height[(y - rows) * width + x];
    }
  }

  // Clear vacated top rows
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      height[y * width + x] = 0;
    }
  }
}
```

### Why This Works

1. **Stateless**: Shift amount derived from `gameTime`, not accumulated
2. **No diffusion**: Energy moves as a block, maintains concentration
3. **Deterministic**: Same gameTime always produces same result
4. **Testable**: Pure function of inputs

### Handling Variable Velocity (Depth-Dependent)

Real waves slow down in shallow water. Two options:

**Option A: Average velocity**
- Use average velocity across the field
- Simple, but less accurate

**Option B: Per-column tracking**
- Track shift per column based on local depth
- More accurate, slightly more complex

Recommend starting with Option A, refine later.

### Stories Compatibility

Stories use large dt (1 second). With shift algorithm:
- `shift = floor(1 * 10 / 11.1) = 0` (no movement in 1s at 10m cells!)

Need to either:
1. Use smaller dt in stories (more frames)
2. Use finer grid in stories
3. Accept coarser movement for stories

## Migration Plan

### Phase 1: Implement shift algorithm
- Add `shiftFieldDown()` utility
- Add time-derived shift calculation
- Keep damping as separate pass

### Phase 2: Update stories
- Adjust grid/timing for shift-based propagation
- Update expected ASCII diagrams

### Phase 3: Tune damping
- Damping now only affects magnitude, not spreading
- Adjust coefficients for desired shore behavior

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/model/02-energy/model.ts` | Replace advection with shift |
| `packages/game/src/main.tsx` | Pass gameTime to updateEnergyField |
| `packages/core/src/model/02-energy/stories/02-energy.ts` | Adjust timing/grid |

## Validation

1. **Energy conservation**: Total field energy stays constant (with damping=0)
2. **No diffusion**: Max energy stays high as wave travels
3. **Correct speed**: Wave reaches shore in expected time
4. **Stories pass**: ASCII diagrams show sharp bands moving
