# Plan 175: Depth Layer Stores Meters (Not Normalized)

**Status**: Pending
**Answers**: Plan 170 open question "Should depth matrix store normalized (0-1) or actual meters?"
**Depends on**: 170-remove-normalization.md

## Decision

**Models store physical real-world units.** Depth layer stores meters.

## Rationale

1. **No universal max depth**: The ocean can be any depth in the real world. A hardcoded `MAX_DEPTH` constant in the model is artificial.

2. **Physics expects meters**: Wave speed `c = sqrt(g * depth)` and friction formulas require meters. Storing normalized values forces every consumer to scale, duplicating the same constant.

3. **Separation of concerns**: The model holds truth in physical units. Visualization/debugging is where we map to colors—that's where scaling belongs.

## Current Bug

Energy field shows all purple in game because:
- Depth layer outputs normalized (0-1)
- `updateEnergyField` calls `getWaveSpeed(depth)` expecting meters
- With normalized depth ~0.5, wave speed is ~2.2 m/s (should be ~12 m/s)
- Friction is `10 / 0.5 = 20` (should be ~0.67)
- Energy decays ~30× faster than intended

Story works because it manually scales: `depthMatrix[i] * MAX_DEPTH`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPTH LAYER (Model)                       │
│  Stores: meters (e.g., 0.5m to 30m)                         │
│  No MAX_DEPTH constant                                       │
│  Physics consumers use values directly                       │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
      ┌──────────┐   ┌────────────┐   ┌───────────┐
      │ Energy   │   │ Velocity   │   │ Height    │
      │ Layer    │   │ Layer      │   │ Layer     │
      │          │   │            │   │           │
      │ Uses     │   │ Uses       │   │ Uses      │
      │ meters   │   │ meters     │   │ meters    │
      │ directly │   │ directly   │   │ directly  │
      └──────────┘   └────────────┘   └───────────┘

┌─────────────────────────────────────────────────────────────┐
│                 DEPTH RENDERER (Visualization)               │
│  Receives: meters                                            │
│  Maps to: 0-1 for color scale                               │
│  Scaling options:                                            │
│    - Relative: (value - min) / (max - min) from dataset     │
│    - Absolute: value / RENDER_MAX_DEPTH (e.g., 50m)         │
└─────────────────────────────────────────────────────────────┘
```

## Renderer Scaling Options

### Relative Scale (recommended for debugging)
```typescript
function renderDepthMatrix(ctx, matrix, width, height, canvasW, canvasH) {
  const min = Math.min(...matrix);
  const max = Math.max(...matrix);
  const range = max - min || 1;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const depth = matrix[row * width + col];
      const normalized = (depth - min) / range; // 0-1
      ctx.fillStyle = viridisToColor(normalized);
      // ...
    }
  }
}
```

### Absolute Scale (for consistent visualization)
```typescript
const RENDER_MAX_DEPTH = 50; // meters - renderer config, not model

function renderDepthMatrix(ctx, matrix, ..., options = {}) {
  const { maxDepth = RENDER_MAX_DEPTH } = options;

  for (...) {
    const normalized = depth / maxDepth; // May not use full color range
    ctx.fillStyle = viridisToColor(Math.min(1, normalized));
  }
}
```

## Implementation Steps

| Step | Task | Complexity |
|------|------|------------|
| 1 | Identify where depth data is created | Research |
| 2 | Change depth creation to output meters | Low |
| 3 | Delete `MAX_DEPTH` constant from stories | Low |
| 4 | Update depth renderer to scale internally | Low |
| 5 | Verify energy field renders in game | Verification |
| 6 | Run all tests | Verification |

## Files to Change

### 1. Depth data source (TBD - need to investigate)
- Where is the Float32Array populated?
- Change from 0-1 to meters at the source

### 2. Stories (delete scaling)
- `02-energy/stories/02-energy.ts`: Delete `MAX_DEPTH = 30` and `createDepthData()` scaling
- Pass depth matrix directly (already in meters)

### 3. Depth renderer
- `01-depth/renderer.ts`: Add internal scaling (relative or absolute)
- Accept optional `maxDepth` for absolute mode

## What NOT to Change

- **Energy model**: Already expects meters, no change needed
- **Velocity model**: Already expects meters
- **Physics formulas**: Correct as-is
- **Energy renderer**: Already handles normalization via `energyMin`/`energyMax`

## Testing

1. Unit tests for depth layer (values are in meters range)
2. Energy story still passes (no manual scaling needed)
3. Game shows energy propagation (not all purple)
4. Depth visualization uses full Viridis range

## Open Questions

1. **Where is depth data created?** Need to trace from game's update loop
2. **Procedural or from image?** Affects where to make the change
3. **Game grid vs story grid?** Same fix applies to both, but implementation location may differ
