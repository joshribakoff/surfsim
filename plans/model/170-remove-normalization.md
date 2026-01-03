# Plan 170: Remove Coordinate Normalization

**Status**: Proposed

## Problem

Model functions use normalized coordinates (0-1 range) instead of direct matrix indexing. This adds unnecessary complexity:

1. **Conversion overhead**: Every layer must convert between normalized coords and row/col indices
2. **Adapter functions**: Stories need `getDepth(normalizedX, normalizedY)` wrappers that just convert back to indices
3. **Bug surface**: Normalization math can introduce off-by-one errors, rounding issues
4. **Token waste**: More code to read, write, maintain
5. **False flexibility**: Normalization implies grids could be different sizes, but they're always the same

## Key Invariant

**Within a context, all layers must be the same size:**
- Game: all layers use game grid size (e.g., 60x40)
- Stories: all layers use story grid size (8x10)

Game and stories may differ from each other, but within each context, sizes must match. This invariant is currently not enforced and violations cause silent bugs.

## Desired State

Layers pass matrices directly. No normalization.

```typescript
// Energy model receives depth matrix directly
updateEnergyField(energyMatrix, velocityMatrix, depthMatrix, dt);

// Inside model, just index:
const depth = depthMatrix[row][col];
```

Stories become simple:
```typescript
const depthMatrix = PROGRESSION_BATHYMETRY.snapshots[0].matrix;
// Pass directly, no adapter needed
```

## Implementation Steps

1. **Add size assertion helper**
   ```typescript
   function assertSameSize(a: Matrix, b: Matrix, context: string) {
     if (a.length !== b.length || a[0].length !== b[0].length) {
       throw new Error(`Layer size mismatch in ${context}: ${a[0].length}x${a.length} vs ${b[0].length}x${b.length}`);
     }
   }
   ```

2. **Change model function signatures** to take `depthMatrix: Matrix` instead of `getDepth: (x, y) => number`

3. **Add assertions at layer boundaries**
   ```typescript
   updateEnergyField(energyMatrix, depthMatrix, dt) {
     assertSameSize(energyMatrix, depthMatrix, 'updateEnergyField');
     // ...
   }
   ```

4. **Delete dead code**:
   - `getDepth()` from `01-depth/model.ts` (if unused after refactor)
   - `getDepth` adapter functions in stories
   - Normalization math in model internals
   - Any `getDepth` re-exports from index files

5. **Update callers** (update/index.ts, main.tsx) to pass matrices directly

6. **Handle depth scaling** - decide: store 0-1 or meters?

## Dead Code to Remove

| Location | What | Why Dead |
|----------|------|----------|
| `01-depth/model.ts` | `getDepth(normalizedX, normalizedY)` | Replaced by direct matrix access |
| `02-energy/stories/01-propagation.ts` | `getDepth` adapter function | No longer needed |
| Model internals | `normalizedX`, `normalizedY` calculations | Direct indexing instead |

## Questions

1. Should depth matrix store normalized (0-1) or actual meters (0-30)?
2. What is the game grid size? Need to verify it differs from story grid size (8x10).

## Risk

Medium - touches core model functions. Assertions will catch size mismatches immediately.

## Testing

- All existing layer tests must pass
- Smoke tests must pass
- Intentionally break a layer size to verify assertion fires
