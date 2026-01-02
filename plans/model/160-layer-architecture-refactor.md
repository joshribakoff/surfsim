# Layer Architecture Refactor

## Status: In Progress - Wire Breaking Logic

| Layer | Model | Story | Notes |
|-------|-------|-------|-------|
| 01-depth | ✅ | ✅ | Bathymetry (static) |
| 02-energy | ✅ | ✅ | Propagation with damping |
| 03-velocity | ✅ | ✅ | Speed from depth |
| 04-height | ✅ | ✅ | Shoaling from energy+depth |
| 05-foam | ✅ | ✅ | Decay, diffusion, advection |
| contours | ✅ | ✅ | Marching squares renderer |

**Current issue:** Energy accumulates near shore instead of converting to foam.
Breaking detection exists (`shouldBreak`) but isn't wired to drain energy → spawn foam.

**Completed:**
- Phase 1 complete: consolidated 9 layers → 5 + renderer
- Stories consolidated to 1 per layer
- All tests passing (smoke, unit)

**Next steps:**
1. Wire breaking logic via orchestrator pattern (see below)
2. Tune energy damping coefficient (currently too aggressive)
3. Phase 5: Deprecate wave objects

**Future work (Phase 5.5):**
- Clean up naming (matrix vs field terminology)

---

## The Core Problem: Stories Have Inline Code

**Stories should import shared models, not contain inline physics.**

When we found `Math.random()` in a story, we asked: "Why is there any code in the story at all?" This revealed the fundamental issue:

### Current State of Layer Migration

| Layer | Status |
|-------|--------|
| 01-depth | ✅ Complete - static bathymetry |
| 02-energy | ✅ Complete - discrete advection, one story |
| 03-velocity | ✅ Complete - story imports from model |
| 04-height | ✅ Complete - story imports from model |
| 05-foam | ✅ Complete - story imports from model |

**The goal:** One story per layer, importing from shared model. Same code runs in stories and game.

---

## Secondary Problems

1. **Names describe physics, not state** - Layers like "shoaling" name phenomena, not data
2. **Too many layers** - Breaking, transfer, spread are processes, not state
3. **Velocity is hardcoded** - Energy propagation assumes "down" at constant speed
4. **Game uses wave objects** - Production uses discrete `progressPerX[]` arrays, not the energy field

## Current Layer Structure (After Refactor)

| # | Name | Purpose |
|---|------|---------|
| 01 | depth | Ocean floor depth (static bathymetry) |
| 02 | energy | Wave energy field (discrete advection + damping) |
| 03 | velocity | Propagation speed/direction from depth |
| 04 | height | Surface elevation (shoaling from energy + depth) |
| 05 | foam | Foam intensity (breaking, decay, spreading) |
| - | contours | Renderer (marching squares on foam) |

---

## Proposed Layer Architecture

### Design Principles

1. **Layers store STATE** - Each layer is a 2D grid of values that persists between frames
2. **Processes are update functions** - Breaking detection, energy transfer, foam spreading are calculations, not layers
3. **Renderers are separate** - Contour rendering operates on state but doesn't store state
4. **Physics terms go in prose** - Stories explain shoaling, refraction; layer names describe data
5. **Orchestrator owns cross-layer logic** - Breaking (height/depth → foam) lives in update orchestrator, not in layers

### Layer Coupling: Orchestrator Pattern (Decision)

**Problem:** How should layers interact? Energy breaking needs to drain energy AND spawn foam.

**Options considered:**
1. **Orchestrator** - Central `updateWorld()` wires layers together
2. **Events** - Layers emit signals, listeners respond
3. **Dependency injection** - Layers receive callbacks for cross-layer ops

**Decision: Orchestrator pattern.**

Layers stay pure and independently testable. Cross-layer physics is explicit in one place:

```typescript
// update/world.ts
function updateWorld(state, dt) {
  updateVelocity(state.velocity, getDepth);       // 03 reads 01
  updateEnergy(state.energy, state.velocity, dt); // 02 reads 03
  updateHeight(state.height, state.energy);       // 04 reads 02

  // Breaking: cross-layer physics
  for (each cell where shouldBreak(height, depth)) {
    const released = drainEnergy(state.energy, x, y);
    spawnFoam(state.foam, x, y, released);
  }

  updateFoam(state.foam, dt);  // 05 internal dynamics
}
```

**Benefits:**
- Layers don't know about each other (no imports between layers)
- Physics flow is readable top-to-bottom
- Easy to test: mock layers, call orchestrator, verify drain→spawn
- Easy to extend: add new cross-layer effects in one place

### The Five State Layers

| # | Name | State Stored | Update Logic |
|---|------|--------------|--------------|
| 01 | **depth** | Ocean floor depth (meters) | Mostly static; future: sand movement |
| 02 | **energy** | Wave energy intensity | Propagates at velocity; damping applied |
| 03 | **velocity** | Propagation (vx, vy) | Computed from depth; stores momentum |
| 04 | **height** | Surface elevation | Derived from energy + depth (shoaling) |
| 05 | **foam** | Foam intensity | Spawned from breaking; decays; spreads |

### Renderers (not state layers)

| Name | Purpose |
|------|---------|
| **contours** | Marching squares on foam grid for smooth edges |

---

## Layer Details

### Layer 01: Depth

Stores ocean floor depth in meters at each grid point.

**Current state:** Static bathymetry with sandbar and point features.

**Future:** Breaking waves move sand, creating feedback loops. Sandbars can shift over time, changing where subsequent waves break. This models real-world beach dynamics where wave action reshapes the bottom.

**Stories:** Film strips showing depth changes over time (currently static, but infrastructure supports dynamic).

### Layer 02: Energy

Stores wave energy that propagates through the water.

**Key insight:** The current code variable is named `height` but this is a misnomer. What propagates is energy, not height. Height is derived downstream.

**Update logic:**
- Propagates in direction/speed from velocity layer
- Damping applied based on depth (friction, not a separate layer)
- Energy injected at horizon from swell sources

### Layer 03: Velocity

Stores propagation velocity `(vx, vy)` at each grid point.

**Why velocity is state:** Without stored velocity, you only have position with no momentum. The velocity field IS the momentum state that determines how energy propagates.

**Physics:** In shallow water, wave speed (celerity) depends only on depth:
```
speed = sqrt(g × depth)
```
Where g = 9.81 m/s². Waves slow down as they enter shallower water. This is independent of wave height or energy.

**Direction:** Initially all waves travel "down" (toward shore). Future: refraction bends waves toward shallower water, reflection off very shallow areas.

**Data structure:** 2D grid of `(vx, vy)` vectors where:
- Magnitude = propagation speed
- Angle = propagation direction

### Layer 04: Height

Stores the actual water surface elevation visible to the player.

**Derived from energy + depth:** As waves slow down in shallow water (velocity layer), they grow taller. This is shoaling:
```
height = energy × (reference_depth / local_depth)^(1/4)
```

**Key insight:** Height is NOT stored in the energy layer. Energy propagates; height is what you see after applying shoaling based on local depth.

### Layer 05: Foam

Stores foam intensity at each grid point.

**Update logic handles all foam processes:**
1. **Spawning:** When `height / depth > 0.78`, wave is breaking → drain energy → add foam
2. **Decay:** Foam fades over time
3. **Spreading:** Foam diffuses laterally
4. **Advection:** Foam drifts toward shore

These are all calculations in the foam update function, not separate layers.

---

## Consolidation: What Gets Removed

The following current layers become **processes within other layers**:

| Current Layer | Becomes |
|---------------|---------|
| 02-bottom-damping | Function in energy update |
| 05-wave-breaking | Threshold check in foam update |
| 06-energy-transfer | Energy drain in foam update |
| 08-foam-dispersion | Spreading logic in foam update |

The following becomes a **renderer**:

| Current Layer | Becomes |
|---------------|---------|
| 09-foam-contours | Renderer that takes foam grid as input |

---

## Phase 1: Consolidate to Five Layers

### Directory Changes

| Current | Action |
|---------|--------|
| `01-bottom-depth` | Rename to `01-depth` |
| `02-bottom-damping` | Delete (merge into energy) |
| `03-energy-field` | Rename to `02-energy` |
| `04-shoaling` | Delete (becomes height layer) |
| `05-wave-breaking` | Delete (merge into foam) |
| `06-energy-transfer` | Delete (merge into foam) |
| `07-foam-grid` | Rename to `05-foam` |
| `08-foam-dispersion` | Delete (merge into foam) |
| `09-foam-contours` | Move to `renderers/contours` |

**New layers to create:**
- `03-velocity`
- `04-height`

### Tasks

- [ ] Create new directory structure
- [ ] Move/merge code from deleted layers
- [ ] Update all imports
- [ ] Fix `Math.random()` bug in foam stories
- [ ] Run lint + build to verify

---

## Phase 2: Implement Velocity Layer

Create `03-velocity/` with proper state management.

**Model:**
- `createVelocityField()` - initializes (vx, vy) grid
- `updateVelocityField(velocityField, depthField)` - recomputes from depth
- Initially: `vx = 0`, `vy = sqrt(g × depth)` (straight down)

**Stories:**
- `01-uniform-depth.ts` - constant velocity everywhere
- `02-sloping-bottom.ts` - velocity decreases toward shore
- `03-refraction.ts` - placeholder for future direction changes

### Tasks

- [ ] Create `03-velocity/model.ts`
- [ ] Create velocity stories
- [ ] Wire velocity into energy propagation

---

## Phase 3: Implement Height Layer

Create `04-height/` with shoaling calculation.

**Model:**
- `computeHeight(energy, depth, referenceDepth)` - applies shoaling formula
- `updateHeightField(heightField, energyField, depthField)` - updates full grid

**Stories:**
- `01-constant-energy.ts` - height increases as depth decreases
- `02-wave-approaching.ts` - energy pulse grows taller near shore

### Tasks

- [ ] Create `04-height/model.ts`
- [ ] Create height stories
- [ ] Wire height into rendering and breaking detection

---

## Phase 4: Consolidate Foam Layer

Merge breaking, transfer, and dispersion into single foam layer.

**This is where the inline code problem is worst.** Current stories (07-foam-grid, 08-foam-dispersion) have:
- Inline `updateFn` with different constants than production (decay 0.05 vs 0.35)
- `Math.random()` breaking determinism
- Physics that doesn't match what runs in the game

**Update function handles:**
1. Breaking detection: `height / depth > 0.78`
2. Energy drain: `drainEnergyAt()` when breaking
3. Foam spawn: add intensity where breaking occurs
4. Decay: reduce intensity over time
5. Spreading: diffuse laterally
6. Advection: drift toward shore

### Tasks

- [ ] Create `05-foam/model.ts` with all foam logic
- [ ] Delete inline `updateFn` from all foam stories
- [ ] Stories import `updateFoamLayer` from model
- [ ] Deprecate `foamModel.ts` (object-based) in favor of grid

---

## Phase 5: Deprecate Wave Objects

The game uses discrete wave objects with `progressPerX[]` arrays. The energy field is the target architecture.

### Tasks

- [ ] Add `USE_ENERGY_FIELD` flag to game config
- [ ] Wire energy field rendering alongside wave objects
- [ ] Run both systems in parallel for visual comparison
- [ ] Mark wave object code as `@deprecated`
- [ ] Eventually remove wave objects after validation

---

## Migration Order

1. **Phase 1:** Consolidate to 5 layers + renderer (directory structure)
2. **Phase 2:** Implement velocity layer with shared model
3. **Phase 3:** Implement height layer with shared model
4. **Phase 4:** Consolidate foam layer, remove inline code from stories
5. **Phase 5:** Deprecate wave objects

**Throughout all phases:** Replace inline `updateFn` code in stories with imports from shared models. The `Math.random()` bug is a symptom - the fix is removing inline code entirely, not patching it.

---

## Files to Create

```
packages/core/src/layers/
  01-depth/          (renamed from 01-bottom-depth)
  02-energy/         (renamed from 03-energy-field)
  03-velocity/       (new)
  04-height/         (new, replaces 04-shoaling)
  05-foam/           (consolidated from 07, 08)

packages/core/src/renderers/
  contours/          (moved from 09-foam-contours)
```

## Files to Delete

```
packages/core/src/layers/
  02-bottom-damping/   (merged into energy)
  05-wave-breaking/    (merged into foam)
  06-energy-transfer/  (merged into foam)
  08-foam-dispersion/  (merged into foam)
```

---

## Progress Log

### 2026-01-02: Phase 1 Committed, Orchestrator Pattern Decided

**Committed:** `8617b2a` - consolidated 9 layers to 5 + renderer

**Directory structure now:**
```
layers/
├── 01-depth/       # Bathymetry (static)
├── 02-energy/      # Wave energy propagation
├── 03-velocity/    # Wave speed (derived from depth)
├── 04-height/      # Surface elevation (derived from energy+depth)
└── 05-foam/        # Foam intensity (decay, diffusion, advection)
renderers/
└── contours/       # Marching squares visualization
```

**Key decision:** Orchestrator pattern for layer coupling.
- Layers don't import each other
- `updateWorld()` orchestrates the update order and cross-layer physics
- Breaking logic (energy → foam) will live in orchestrator

**Current state:** Energy accumulates near shore because breaking isn't wired.
Next: Implement `updateWorld()` with breaking detection.

### 2026-01-01: Semi-Lagrangian Advection Fixed

**Problem:** Energy was being created from thin air. Total energy increased from 5 to 17.5 over 5 seconds.

**Root cause:** `sampleBilinear` clamped out-of-bounds positions to the grid edge. When row 0's source was outside the grid (srcY < 0), it sampled from itself instead of getting 0. This caused row 0 to act as an infinite source - it never lost energy while downstream rows pulled copies of it.

**Fix:** Modified `sampleBilinear` to treat out-of-bounds corners as 0 (open boundary). Now when srcY = -0.01 (1% outside grid), the cell gets 99% of the edge value blended with 1% of 0. Energy drains gradually and correctly.

**Results:**
- Row 0 now drains: F → 4 → 2 → 1 → 0 over 5 seconds
- Total energy decreases (damping works)
- No more infinite source bug

**Remaining issue:** Too much vertical spreading. Energy should stay in a tighter horizontal band as it propagates. Real waves compress/stack in shallow water, they don't diffuse vertically. This is due to bilinear interpolation smoothing.

**Next steps:**
1. Consolidate 9 depth stories → 1-2 with interesting lateral depth variation
2. Add lateral spreading tests (waves bending around sandbars)
3. Tune vertical spreading - may need sharpening or flux-limiting

### 2026-01-01: Phase 1.5 Complete

**Energy transport fixed:**
- Removed broken "blending" that conflated transport with diffusion
- Implemented discrete advection (sharp bands, no artificial spreading)
- Separated damping as post-advection step (coefficient-controlled)
- Consolidated 4 stories → 1 story ("Energy Propagation")
- Deleted test-only `updateDeepWaterTranslation` function
- Energy layer now correctly demonstrates: sharp bands translate, damping increases in shallow water

### 2026-01-01: Phase 1 Complete

**Directory restructuring done:**
- `01-bottom-depth` → `01-depth` ✅
- `03-energy-field` → `02-energy` ✅
- Created `03-velocity/` with model ✅
- `04-shoaling` stories → `04-height/` with model ✅
- `05-wave-breaking`, `06-energy-transfer`, `07-foam-grid`, `08-foam-dispersion` → consolidated into `05-foam/` ✅
- `09-foam-contours` → `renderers/contours/` ✅
- Deleted `02-bottom-damping` (damping is in energy model) ✅

**New models created:**
- `03-velocity/model.ts`: `speed = sqrt(g × depth)`, stores (vx, vy) vectors
- `04-height/model.ts`: shoaling formula `height = energy × (refDepth/depth)^0.25`
- `05-foam/model.ts`: decay, diffusion, advection, spawning

**Tests passing:** 552 unit tests, 5 smoke tests

**Remaining work:** Stories still have inline `updateFn` - need to import from models.

---

## Phase 1.5: Fix Energy Transport (Critical Bug)

**Problem discovered:** The energy model's `updateEnergyField` conflates three distinct physical processes:

```javascript
// Current broken code (line 113)
height[idx] = height[idx] * (1 - blend) + height[aboveIdx] * blend;
```

This "blending" creates artificial diffusion. It mixes:
- **Transport** (moving energy from A to B)
- **Diffusion** (spreading energy to neighbors)
- **Damping** (losing energy to friction)

Result: Even with `dampingCoefficient=0`, energy spreads instead of translating as sharp bands.

### The Physics

1. **Transport (advection)**: Energy moves at velocity determined by depth
   - Speed: `c = √(g × depth)` — slower in shallow water
   - Direction: toward shore (future: refraction bends toward shallower water)
   - Sharp bands should stay sharp during transport

2. **Damping**: Energy lost to bottom friction
   - `decay = exp(-coefficient × dt / depth^exponent)`
   - With `coefficient=0`: no loss (decay=1)
   - With `coefficient>0`: faster decay in shallow water

3. **Lateral spreading**: NOT from transport algorithm
   - Emerges from **refraction** in velocity field
   - When depth varies laterally, waves bend toward shallower side
   - This creates non-zero `vx` in velocity field
   - Energy follows curved velocity vectors → natural spreading

### The Fix

**Separate advection from damping:**

```javascript
// 1. Discrete advection based on velocity
field._accumY = (field._accumY || 0) + speed * dt;
while (field._accumY >= rowHeight) {
  field._accumY -= rowHeight;
  shiftRowsDown(field);  // Move all energy down one row
}

// 2. Apply damping separately (only if coefficient > 0)
if (dampingCoefficient > 0) {
  for (each cell) {
    const decay = Math.exp(-dampingCoefficient * dt / Math.pow(depth, exponent));
    energy[idx] *= decay;
  }
}
```

**Key principles:**
- Transport is discrete row shifting — no blending, no artificial spreading
- Damping is a separate multiplier controlled by coefficient
- Lateral spreading comes from velocity field (refraction), not from transport
- Stories with `coefficient=0` should show sharp bands translating cleanly

### Velocity-Energy Coupling

Currently: Energy model ignores velocity field, assumes "straight down"
Target: Energy model reads from velocity field for transport direction/speed

```javascript
function updateEnergyField(energyField, velocityField, depthFn, dt, options) {
  // Get speed from velocity field (which gets it from depth)
  // Advect energy along velocity vectors
  // Apply damping based on coefficient
}
```

### Tasks

- [x] Delete blending code from `updateEnergyField`
- [x] Implement discrete advection
- [x] Separate damping into post-advection step
- [x] Wire `02-energy` to import from `03-velocity`
- [x] Consolidate energy stories (see below)

### Story Consolidation

**Problem:** Too many stories permuting parameters (no-damping, low-damping, high-damping).
This creates clutter and slow tests without adding insight.

**Solution:** 1-2 stories showing organic behavior with realistic bathymetry:

1. **"Wave approaching sandbar"** - Realistic scenario:
   - Bathymetry: slope + sandbar that varies in X
   - Shows sharp bands translating toward shore
   - Shows natural damping in shallow water (no coefficient permutations)
   - Sandbar creates depth variation → different damping rates across X

2. **"Energy drain"** (keep) - Demonstrates breaking/foam interaction

Coefficient tuning can be exposed as a knob later, not as separate stories.

---

## Phase 5.5: Simplify Naming

**Problem:** Too many terms for the same concepts cause confusion.

### Current Confusing State
- `matrix` and `field` used interchangeably
- `matrixToField` function implies they're different
- Property names vary: `height`, `intensity`, `data`, `values`
- Layer names conflated with property names

### Target Naming Convention

1. **Layer name = what values represent**
   - `01-depth`: depth values in meters
   - `02-energy`: energy values
   - `04-height`: surface height values
   - `05-foam`: foam intensity values

2. **Matrix = the data structure** (2D grid of numbers)
   - Don't need separate "field" concept
   - All layers store a matrix

3. **Value = generic term** for numbers in the matrix
   - Access via `matrix[row][col]` or `values[idx]`
   - No domain-specific property names in shared utilities

### Tasks
- [ ] Rename `matrixToField` → simpler (or remove if unnecessary)
- [ ] Standardize property access across test utils
- [ ] Remove redundant abstractions

---

## Phase 6: Clean Model Boundaries

**Problem identified:** Models contain ad-hoc helpers that don't belong.

### Principle: Models = State + State Operations

Each model should contain:
- **State definition** (grid structure, initial values)
- **State access** (getValueAt, interpolation)
- **State mutation** (update functions that operate on the grid)

Models should NOT contain:
- Cross-layer logic (breaking detection uses height AND depth)
- Conversion utilities (amplitudeToHeight)
- Ad-hoc config accessors (getPeakX, getMinDepth)

### Cleanup Tasks

**01-depth/model.ts:**
- [x] Remove `shouldBreak()` - already in foam model
- [x] Remove `amplitudeToHeight()` - already in waveModel
- [ ] Remove `getPeakX()`, `getMinDepth()` - just access config directly (low priority)

**Cross-layer interactions:**
Breaking detection (`height/depth > 0.78`) is emergent from two layers interacting. It belongs in:
- The **update orchestrator** that has access to both height and depth
- Or in **05-foam** which consumes this logic to spawn foam

The goal is emergent behavior from layer interactions, not hardcoded discrete concepts scattered across files.
