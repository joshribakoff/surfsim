# Layer Architecture Refactor

## The Core Problem: Stories Have Inline Code

**Stories should import shared models, not contain inline physics.**

When we found `Math.random()` in a story, we asked: "Why is there any code in the story at all?" This revealed the fundamental issue:

### Current State of Layer Migration

| Layers | Status | Issue |
|--------|--------|-------|
| 01-03 | Partially migrated | Have `model.ts` files, stories starting to use them |
| 04-09 | Not migrated | Stories have inline `updateFn` implementations |

**Layers 04-09 have inline code that:**
- Duplicates production logic (but with different constants)
- Deviates from production (fake/simplified physics)
- Contains bugs like `Math.random()` that break determinism
- Is NOT the code that runs in the actual game

**The goal:** Every story should import from a shared model. The same code that runs in stories must run in the game. No inline physics in stories.

---

## Secondary Problems

1. **Names describe physics, not state** - Layers like "shoaling" name phenomena, not data
2. **Too many layers** - Breaking, transfer, spread are processes, not state
3. **Velocity is hardcoded** - Energy propagation assumes "down" at constant speed
4. **Game uses wave objects** - Production uses discrete `progressPerX[]` arrays, not the energy field

## Current Layer Structure

| # | Current Name | Issues |
|---|--------------|--------|
| 01 | bottom-depth | OK but verbose name |
| 02 | bottom-damping | Should be a function, not a layer |
| 03 | energy-field | Internal variable named `height` is confusing |
| 04 | shoaling | Named after physics, stores nothing |
| 05 | wave-breaking | Process, not state |
| 06 | energy-transfer | Process, not state |
| 07 | foam-grid | Has `Math.random()` bug |
| 08 | foam-dispersion | Process, not state |
| 09 | foam-contours | Renderer, not state |

---

## Proposed Layer Architecture

### Design Principles

1. **Layers store STATE** - Each layer is a 2D grid of values that persists between frames
2. **Processes are update functions** - Breaking detection, energy transfer, foam spreading are calculations, not layers
3. **Renderers are separate** - Contour rendering operates on state but doesn't store state
4. **Physics terms go in prose** - Stories explain shoaling, refraction; layer names describe data

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
