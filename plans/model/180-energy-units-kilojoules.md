# Plan: Energy Field Units - Kilojoules (kJ)

## Goal
Convert energy field from dimensionless 0-1 amplitude to real-world kilojoules (kJ), following the pattern established by Layer 01 (depth in meters).

## Key Insight
> "Energy is the source of truth. Height and period will be derived FROM energy, not the other way around."

We're directly injecting energy in kJ based on surf report conventions - not converting from height/period.

## Pattern to Follow: Layer 01 (Depth)

**Depth renderer uses dynamic scaling:**
```typescript
const colorScaleDepth = Math.max(...depthData) || 1;  // Dynamic from data
const normalized = Math.sqrt(depth / colorScaleDepth);
```

**Energy renderer should do the same:**
```typescript
const colorScaleEnergy = Math.max(...energyData) || 1;  // Dynamic from data
const normalized = energy / colorScaleEnergy;
```

**No hardcoded DEFAULT_ENERGY_MAX** - the renderer adapts to whatever values exist in the field.

---

## Surf Report Energy Reference (kJ)

| Energy (kJ) | Surf Conditions |
|-------------|-----------------|
| 50-200 | Small waves, longboard |
| 200-500 | Good shortboard waves |
| 500-1000 | Large, serious waves |
| 1000-2000 | Very large, challenging |
| 2000+ | Heavy/extreme |

---

## Implementation Plan

### Phase 1: Stateless Renderer with Max-So-Far Scaling ✅ DONE
**Files:**
- `packages/core/src/model/02-energy/renderer.ts` - stateless, requires `scaleMax` parameter
- `packages/game/src/main.tsx` - tracks max seen so far, passes to renderer
- Story viewer - calculates max per snapshot

**Approach:** Renderer is pure/stateless. Caller owns scaling state.

```typescript
// Renderer (stateless)
export interface EnergyRenderOptions {
  scaleMax: number;  // Required - maximum value for scale
}

// Game loop (owns state)
let energyMaxSoFar = 1;
const currentMax = Math.max(...field.height) || 1;
energyMaxSoFar = Math.max(energyMaxSoFar, currentMax);  // Only increases
renderEnergyField(ctx, field, top, bottom, w, { scaleMax: energyMaxSoFar });

// Story viewer (per-snapshot max)
const maxValue = Math.max(...snap.matrix) || 1;
renderEnergyMatrix(ctx, snap.matrix, w, h, cw, ch, { scaleMax: maxValue });
```

### Phase 2: Unified Energy Injection with kJ Units ✅ DONE
**Files:**
- `packages/core/src/model/02-energy/model.ts` - unified `injectEnergyPulse(matrix, width, energyKJ)`
- `packages/game/src/main.tsx` - calculates kJ based on wave type
- `packages/core/src/model/02-energy/model.test.ts` - updated tests for kJ values

**Implementation:**
```typescript
// Unified function (accumulates)
export function injectEnergyPulse(matrix: Float32Array, width: number, energyKJ: number): void {
  for (let col = 0; col < width; col++) {
    matrix[col] += energyKJ;
  }
}

// Game calculates kJ
const baseEnergy = type === WAVE_TYPE.SET ? 800 : 150;
const energyKJ = baseEnergy * amplitude;
injectEnergyPulse(world.energyField.height, world.energyField.width, energyKJ);

// Stories use explicit kJ
injectEnergyPulse(matrix, GRID_WIDTH, 500); // 500 kJ
```

**Deleted:** `injectWavePulse` (legacy wrapper function)

### Phase 4: Update Energy Drain Scaling
**File: `packages/core/src/update/index.ts` (line 181)**

Current magic number assumes 0-1 scale:
```typescript
const drainAmount = wave.amplitude * 20.0;
```

New - drain proportional to available energy:
```typescript
const energyAtBreak = getHeightAt(energyField, normalizedX, foamProgress);
const drainAmount = energyAtBreak * 0.8;  // Drain 80% at breaking
```

### Phase 5: Update Breaking Threshold
**File: `packages/core/src/state/waveModel.ts` (line 119)**

```typescript
// Current (dimensionless):
export const MIN_ENERGY_FOR_BREAKING = 0.1;

// New (kJ):
export const MIN_ENERGY_FOR_BREAKING = 50;  // 50 kJ minimum
```

### Phase 6: Update Foam Opacity Mapping
**File: `packages/core/src/update/index.ts` (line 267)**

```typescript
// Current:
foam.opacity = Math.min(1.0, energyReleased * 2);

// New - 500 kJ release = full opacity:
foam.opacity = Math.min(1.0, energyReleased / 500);
```

### Phase 7: Update Stories
**File: `packages/core/src/model/02-energy/stories/02-energy.ts`**

Update initial energy injection to kJ:
```typescript
export function initialMatrix(): Float32Array {
  const matrix = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
  injectEnergyPulse(matrix, GRID_WIDTH, 500);  // 500 kJ pulse
  return matrix;
}
```

### Phase 8: Update Tests
**File: `packages/core/src/model/02-energy/model.test.ts`**

Replace 0-1 test values with kJ:
- `1.0` → `1000` (kJ)
- `0.5` → `500` (kJ)
- `0.3` → `300` (kJ)

---

## Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/model/02-energy/renderer.ts` | Dynamic scaling, remove hardcoded max |
| `packages/game/src/main.tsx` | Inject kJ instead of amplitude |
| `packages/core/src/model/02-energy/model.ts` | Add energyKJ param to injectEnergyPulse |
| `packages/core/src/update/index.ts` | Update drain + opacity scaling |
| `packages/core/src/state/waveModel.ts` | Update MIN_ENERGY_FOR_BREAKING |
| `packages/core/src/model/02-energy/stories/02-energy.ts` | Use kJ values |
| `packages/core/src/model/02-energy/model.test.ts` | Update test values |

---

## Validation

1. **Visual**: Energy field shows full color gradient (purple → yellow)
2. **Stories**: Pass with updated kJ-scale expected values
3. **Breaking**: Foam appears at appropriate energy levels
4. **Dynamic**: Renderer adapts to whatever max energy exists in field

---

## What This Enables (Future)

- **Height layer**: Can derive wave height from energy when shoaling is implemented
- **Period tracking**: Could add later if needed for more accurate physics
- **Energy conservation**: Proper kJ units make conservation calculations meaningful
