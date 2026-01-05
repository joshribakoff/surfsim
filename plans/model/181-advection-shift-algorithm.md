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

## Root Cause: Confusing Displacement with Transfer Rate

The quantity `(velocity * dt) / cellHeight` is the **CFL number** - it tells you how many cells the wave front traverses per timestep. It's a *displacement*, not a *transfer coefficient*.

**What the code implements (diffusion equation):**
```
∂E/∂t = D · ∂²E/∂x²
```
Energy spreads from high to low concentration. A pulse flattens over time.

**What wave propagation actually is (advection equation):**
```
∂E/∂t + v · ∂E/∂x = 0
```
Energy translates at velocity v. A pulse stays a pulse.

**The single-line bug:**
```typescript
// WRONG: treats displacement as transfer rate → diffusion
const transfer = height[idx] * fraction;

// RIGHT: displacement tells you WHERE to move energy, not HOW MUCH
shiftFieldDown(field, Math.floor(totalDisplacement));
```

## Valid vs Invalid Use of Percentages

### INVALID: Temporal fraction (current bug)
```typescript
CFL = 0.5  // wave moved half a cell this frame
// WRONG: "Transfer 50%, leave 50% behind"
// This creates diffusion - energy that "hasn't moved yet" is fiction
```

### VALID: Directional routing (future 2D velocity)
```typescript
// Velocity at cell points in multiple directions
const vx = 2, vy = 1;
const total = Math.abs(vx) + Math.abs(vy);  // 3

// Route energy by direction ratio
const ratioX = Math.abs(vx) / total;  // 67%
const ratioY = Math.abs(vy) / total;  // 33%

// 67% goes X, 33% goes Y - ALL energy moves, just different directions
// No diffusion because nothing "stays behind"
```

**Key principle:** Energy doesn't partially exist in two places based on sub-cell position. Percentages should only determine **which direction** energy goes, not **whether** it moves.

## Future: Directional Energy Fields

When waves converge from opposite directions, naive shifting would merge them:
```
    →  ←
   [A][B]
     ↓
    [C]    ← energies combine and lose individual momentum
```

### Solution: Track energy by travel direction

```typescript
interface DirectionalEnergy {
  towardShore: Float32Array;  // Primary wave direction
  towardLeft: Float32Array;   // Refracted component
  towardRight: Float32Array;  // Refracted component
}
```

- Energy arriving from the right goes into `towardLeft`, continues moving left
- Energy arriving from the left goes into `towardRight`, continues moving right
- Waves pass through each other without collapsing
- Velocity field ratios route energy *between* directional buckets at boundaries

### For now (single direction)

All current energy moves shoreward. The shift algorithm works because:
- No directional splitting needed yet
- Energy shifts as a block
- Damping remains separate (affects magnitude, not direction)

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
5. **Extensible**: Structure supports adding directional fields later

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

### Phase 4 (Future): Directional energy fields
- Split single `height` array into directional components
- Implement velocity-ratio routing between directions
- Enable wave crossing without merging

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
