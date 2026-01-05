# Dead Code Analysis Report

**Generated**: 2026-01-04
**Branch**: layer-work

## Executive Summary

| Category | Count | Risk |
|----------|-------|------|
| Unused Files | 2+ | Medium |
| Unused Dependencies | 4 | Low |
| Duplicate Files (100% identical) | 1 pair | **HIGH** |
| Unused Exports (production) | 20+ | Medium |
| Duplicate Code Clones | 43 | Medium |
| Unused Test Utilities | 8 | Low |

---

## ~~CRITICAL: Duplicate Files~~ ✅ RESOLVED

### `energyFieldRenderer.ts` - FIXED

**Original error**: Analysis incorrectly identified which file was golden vs dead.

| File | Status | Reason |
|------|--------|--------|
| `render/energyFieldRenderer.ts` | **DELETED** | Legacy, not imported anywhere |
| `model/02-energy/renderer.ts` | **GOLDEN** | Used by game + viewer, colocated with layer |

**Principle**: Renderers belong colocated with their layer in `model/{N}-*/renderer.ts`, not in root `render/`.

---

## ~~HIGH: Energy Model Duplication~~ ✅ RESOLVED

| File | Status |
|------|--------|
| `state/energyFieldModel.ts` | **DELETED** - Legacy, superseded by model layer |
| `state/energyFieldModel.test.ts` | **DELETED** |
| `model/02-energy/model.ts` | **GOLDEN** - All imports updated to use this |

**Also deleted (legacy wave rendering):**
| File | Status |
|------|--------|
| `render/waveRenderer.ts` | **DELETED** - Legacy discrete wave rendering |
| `render/waveRenderer.test.ts` | **DELETED** |

**Imports updated:**
- `state/eventStore.ts` → imports from `model/02-energy`
- `state/foamGridModel.ts` → imports from `model/02-energy`
- `update/index.ts` → imports from `model/02-energy`
- `state/index.ts` → removed legacy re-export
- `render/index.ts` → removed legacy waveRenderer export
- `main.tsx` → removed renderWaves call and import

---

## Unused Files

| File | Reason |
|------|--------|
| `scripts/generate-story-ascii.ts` | References outdated path `packages/core/src/layers` (renamed to `model`) |
| `packages/core/src/core/math.ts` | Entire module (73 lines) never imported - 3D math utilities for planned WebGL |

---

## Unused Dependencies

| Package | Location |
|---------|----------|
| `concurrently` | `package.json:64` |
| `eslint-plugin-prettier` | `package.json:67` |
| `gifenc` | `package.json:69` |
| `pngjs` | `package.json:76` |

---

## Unused Exports by Module

### `packages/core/src/render/marchingSquares.ts`

| Function | Status |
|----------|--------|
| `renderMultiContour()` | Dead - only `*FromGrid` variants used |
| `renderMultiContourOptionA()` | Dead |
| `renderMultiContourOptionB()` | Dead |
| `renderMultiContourOptionC()` | Dead |
| `extractContours()` | Dead - only tested |
| `simplifyContour()` | Dead - only tested |
| `drawSmoothContour()` | Dead - only tested |
| `renderContourDebug()` | Dead - only tested |
| `buildIntensityGridOptionA()` | Dead - only used by dead function |
| `buildIntensityGridOptionC()` | Dead - only used by dead function |

### `packages/core/src/model/05-foam/`

| Function | Status |
|----------|--------|
| `applyDecay` | Exported but only used internally |
| `applyDiffusion` | Exported but only used internally |
| `applyAdvection` | Exported but only used internally |
| `getFoamAt` | Exported but never imported |

### `packages/core/src/render/colorScales.ts`

| Function | Status |
|----------|--------|
| `viridisToColor()` | Internal only - never called directly |
| `depthToViridis()` | Never called anywhere |

### `packages/game/src/update/playerUpdate.ts`

| Function | Status |
|----------|--------|
| `initializePlayer` | Exported but never imported |
| `createAIState` (re-export) | Redundant - callers import directly |

---

## Unused Test Utilities

`packages/core/src/test-utils/matrixField.ts` is almost entirely dead:

| Function | Status |
|----------|--------|
| `fieldToMatrix()` | Orphaned - 0 imports |
| `cloneField()` | Orphaned - 0 imports |
| `matricesEqual()` | Orphaned - 0 imports |
| `matrixTotalEnergy()` | Orphaned - 0 imports |
| `matrixMax()` | Orphaned - 0 imports |
| `matrixPeakRow()` | Orphaned - 0 imports |
| `float32ToMatrix()` | Orphaned - 0 imports |

Also unused: `createStrip()` in `strip.ts`

---

## Duplicate Code Patterns (Lower Priority)

| Pattern | Locations | Lines |
|---------|-----------|-------|
| Foam deposition logic | `update/index.ts` lines 144-169 vs 229-254 | 25 lines each |
| Grid coordinate conversion | 4+ model files | ~8 lines each |
| E2E test setup | Multiple spec files | ~5 lines each |
| React canvas hook pattern | Filmstrip.tsx, ProgressionPlayer.tsx | ~10 lines each |

---

## Architecture Migration In Progress

The codebase is transitioning from `state/` to `model/` architecture:

```
OLD: packages/core/src/state/energyFieldModel.ts
NEW: packages/core/src/model/02-energy/model.ts
```

Both are actively imported, creating duplicate code that could diverge.

---

## Summary Statistics

- **Total files analyzed**: 125
- **Total lines**: 16,213
- **Duplicated lines**: 741 (4.57%)
- **Duplicated tokens**: 7,499 (5.48%)
- **Total clones found**: 43

---

## Prioritized Action Items

### Priority 0: Safe Deletions (No Risk)
1. Delete `packages/core/src/model/02-energy/renderer.ts` (100% duplicate)
2. Delete `scripts/generate-story-ascii.ts` (outdated script)
3. Remove unused devDependencies: `concurrently`, `eslint-plugin-prettier`, `gifenc`, `pngjs`

### Priority 1: Consolidation Needed
1. Consolidate `state/energyFieldModel.ts` with `model/02-energy/model.ts`
2. Delete or consolidate duplicate test files

### Priority 2: Clean Up Exports
1. Remove dead marching squares functions (non-grid variants)
2. Stop exporting internal foam functions (`applyDecay`, etc.)
3. Remove unused test utilities in `matrixField.ts`

### Priority 3: Verify Before Removing
1. Verify `core/math.ts` is not planned for future 3D features
2. Clean up unused locals in `App.tsx` (UI code may be WIP)
