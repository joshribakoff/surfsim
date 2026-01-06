---
name: story-editor
description: Collaborative ASCII-based story editing. Use when editing stories, working with expectedAscii, or user invokes /story. Auto-apply when editing */stories/*.ts files.
---

# Story Editor Skill

Enables collaborative editing of story ASCII diagrams. The user specifies what they want via ASCII art; you update the code to produce it.

## Philosophy

**ASCII is the spec.** Don't interpret prose descriptions - they're ambiguous and lead to hallucinations. Instead:

1. Show the current ASCII
2. User edits it to show what they want
3. You modify the code to produce that exact ASCII

## Story Structure

```typescript
const story = defineStory({
  id: 'layer/name',
  title: 'Human Title',
  prose: `Brief description (keep minimal - ASCII is the truth)`,
  initialMatrix: (() => {
    // Code that generates the matrix
    return matrix;
  })(),
  captureTimes: [0],  // When to capture (usually just [0] for static layers)
  expectedAscii: `
    t=0s
    FFFFFFFF
    DDDDDDDD
    ...
  `,
});
```

## Workflow: User Edits ASCII

1. **Extract current ASCII** from `expectedAscii` field
2. **Display it clearly** with grid dimensions noted
3. **Wait for user edit** - they paste back modified ASCII
4. **Update `initialMatrix`** code to produce the new ASCII
5. **Run test** to verify: `npx vitest run <story-file>`

## Updating initialMatrix

When user provides new ASCII, reverse-engineer the generation logic:

```typescript
// User wants:
//   FFFFFFFF
//   CCCCCCCC
//   88888888
//   44444444

// Simple linear gradient:
for (let row = 0; row < GRID_HEIGHT; row++) {
  const value = 1 - row / (GRID_HEIGHT - 1);
  for (let col = 0; col < GRID_WIDTH; col++) {
    matrix[row][col] = value;
  }
}
```

For complex patterns, describe what you see:
- "Vertical stripe of high values in center"
- "Gradient from top to bottom"
- "Checkerboard pattern"

Then implement code that produces it.

## ASCII Reference

| Char | Value | Visual meaning |
|------|-------|----------------|
| `-`  | 0.00  | None/zero |
| `1-4`| 0.1-0.4 | Low range |
| `A-C`| 0.5-0.7 | Medium range |
| `D-F`| 0.8-1.0 | High range |

## Anti-patterns

**Don't do this:**
- Write prose explaining what the code "should" do
- Add physics commentary to static depth layers
- Guess what user wants from vague descriptions

**Do this:**
- Show ASCII, get ASCII back, implement ASCII
- Keep prose minimal (1 sentence max)
- Let the ASCII speak for itself

## Testing

After updating a story:
```bash
npx vitest run packages/core/src/model/01-depth/stories/01-bathymetry.ts
```

The test verifies that `initialMatrix` produces `expectedAscii`.
