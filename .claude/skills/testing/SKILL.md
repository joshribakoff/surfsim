---
name: testing
description: STOP. BEFORE running ANY test commands (npm run lint, npm test, npx vitest, npx playwright, etc.), you MUST invoke this skill first. Trigger phrases requiring this skill: "run tests", "status of tests", "check tests", "make sure tests pass".
---

# Testing Skill (Orchestrator)

## CRITICAL: Clarify Ambiguous Test Requests

When the user asks to "run the tests", "check test status", "run all tests", or similar **without specifying which tests**, you MUST clarify:

- **Unit tests only?** (`npm run test:unit`)
- **Visual tests only?** (`npm run test:visual:headless`)
- **All tests?** (unit + visual + smoke)

Do NOT assume. "Run the tests" could mean any of these. Ask first.

**Trigger phrases requiring clarification:**
- "run the tests"
- "run all tests"
- "check test status"
- "status of tests"
- "make sure tests pass"

**Clear requests that don't need clarification:**
- "run unit tests" → `npm run test:unit`
- "run visual tests" → `npm run test:visual:headless`
- "run smoke test" → `npm run test:smoke`
- "run lint" → `npm run lint`

This skill coordinates testing strategy across all test types. Tests are **colocated** with the code they test - when viewing a module, you see all its tests nearby.

## Test Type Index

```
Testing
│
├── Static Analysis
│   └── Linting ─────────────────── ESLint syntax/import checks
│
├── Data Model Tests (Vitest)
│   ├── Pure Logic Tests ────────── Single functions, math, state transitions
│   └── Matrix Progression Tests ── 2D grid evolution over time (ASCII diagrams)
│
├── Component Tests (Vitest + Testing Library)
│   └── React Component Tests ───── Behavior, state, user interactions
│
├── Visual Regression (Playwright)
│   ├── Component Screenshots ───── React component pixel comparison
│   └── Canvas Filmstrip Tests ──── Matrix-to-canvas rendered progressions
│
└── Integration / E2E (Playwright)
    └── Smoke Tests ─────────────── App loads without JS errors
```

## Test Types, Files, and Colocation

All tests are colocated with their source. When you open a folder, you see the code and all its tests together.

### Data Model Tests

| Test Type | File Pattern | Colocated With | Skill |
|-----------|--------------|----------------|-------|
| Pure logic | `*.test.ts` | `src/**/*.ts` | `logic-testing` |
| Matrix progression | `*Progressions.test.ts` | `src/render/*Progressions.ts` | `matrix-data-model-progression-testing` |

```
src/state/
  waveModel.ts              ← Source
  waveModel.test.ts         ← Logic test (colocated)

src/render/
  bathymetryProgressions.ts      ← Matrix definitions
  bathymetryProgressions.test.ts ← ASCII progression test (colocated)
```

### Component Tests

| Test Type | File Pattern | Colocated With | Skill |
|-----------|--------------|----------------|-------|
| React behavior | `*.test.tsx` | `src/**/*.tsx` | `logic-testing` (same patterns) |

```
src/ui/
  WaveControls.tsx          ← Component
  WaveControls.test.tsx     ← Behavior test (colocated)
```

### Visual Regression Tests

| Test Type | File Pattern | Colocated With | Skill |
|-----------|--------------|----------------|-------|
| Component screenshots | `*.visual.spec.ts` | `stories/**/` | `component-screenshot-testing` |
| Canvas filmstrips | `*.visual.spec.ts` | `stories/**/` | `canvas-filmstrip-testing` |

```
stories/01-bathymetry/
  01-bathymetry.mdx              ← Story documentation
  01-bathymetry.visual.spec.ts   ← Visual test (colocated)
  strip-bathymetry-basic.png     ← Baseline screenshot (colocated)
  strip-bathymetry-features.png  ← Baseline screenshot (colocated)
```

### Integration Tests

| Test Type | File Pattern | Location | Skill |
|-----------|--------------|----------|-------|
| Smoke test | `smoke.spec.js` | `tests/` | (this skill) |
| E2E tests | `*.spec.js` | `tests/` | (this skill) |

## Choosing the Right Test Type

| What you're testing | Test type | File to create |
|---------------------|-----------|----------------|
| Pure function returns correct value | Logic test | `myModule.test.ts` next to `myModule.ts` |
| Matrix evolves correctly over time | Progression test | `*Progressions.test.ts` with ASCII assertions |
| React component behavior/state | Component test | `MyComponent.test.tsx` next to `MyComponent.tsx` |
| Rendered pixels match baseline | Visual regression | `*.visual.spec.ts` in `stories/` folder |
| App loads without crashing | Smoke test | `tests/smoke.spec.js` |

## Test Order (Fastest First)

Run cheap tests first to catch issues early:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Lint                    ~1s    npm run lint              │
├─────────────────────────────────────────────────────────────┤
│ 2. Smoke                   ~3s    npx playwright test       │
│                                   tests/smoke.spec.js       │
├─────────────────────────────────────────────────────────────┤
│ 3. Logic/Progression      ~secs   npx vitest run <file>     │
├─────────────────────────────────────────────────────────────┤
│ 4. Component Tests        ~secs   npx vitest run <file>     │
├─────────────────────────────────────────────────────────────┤
│ 5. Visual Regression      ~mins   npm run test:visual:      │
│                                   headless                  │
└─────────────────────────────────────────────────────────────┘
```

**Stop and fix** at the first failure. Don't run expensive visual tests when data tests are failing.

## Quick Reference

```bash
# Static analysis
npm run lint                              # ~1s

# Smoke test
npx playwright test tests/smoke.spec.js   # ~3s

# Data model tests (Vitest)
npx vitest run src/path/file.test.ts      # Specific file
npx vitest run src/render/*Progressions*  # All progression tests
npm test                                   # All Vitest tests

# Visual regression (Playwright)
npm run stories:build                      # Verify stories compile
npm run test:visual:headless               # Run visual regression
npm run test:visual:update:headless        # Update baselines
npm run reset:visual                       # Clear results
npm run reset:visual:all                   # Clear results + baselines
```

## Debugging by Symptom

| Symptom | Likely cause | Which test to check |
|---------|--------------|---------------------|
| Logic test fails | Bug in function | `*.test.ts` colocated with source |
| ASCII progression differs | Data model bug | `*Progressions.test.ts` |
| Component test fails | React behavior bug | `*.test.tsx` colocated with component |
| Visual test fails, data correct | Rendering/CSS bug | `*.visual.spec.ts` in stories |
| All pass, browser wrong | CSS transition conflict | Check 60fps element transitions |

## Skill Index

| Skill | What it tests | Key files |
|-------|---------------|-----------|
| `logic-testing` | Pure functions, math, state | `*.test.ts` |
| `matrix-data-model-progression-testing` | 2D grid evolution (ASCII) | `*Progressions.test.ts` |
| `component-screenshot-testing` | React component pixels | UI component `*.visual.spec.ts` |
| `canvas-filmstrip-testing` | Canvas-rendered matrix strips | Progression `*.visual.spec.ts` |
| `visual-regression` | Shared visual test infrastructure | All `*.visual.spec.ts` |

## Critical Principles

### 1. Colocation

Tests live next to what they test. Don't hunt for tests in a separate `tests/` tree.

### 2. Data Gates Visual

Never run visual tests when data tests fail. The matrix is the source of truth - if the numbers are wrong, the pixels will be wrong too.

### 3. Test Utilities Must Be Tested

`src/test-utils/` is foundational. A bug there corrupts all tests:

```bash
npx vitest run src/test-utils/
```
