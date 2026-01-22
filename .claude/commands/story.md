---
description: Edit story ASCII diagrams collaboratively
argument-hint: <story-id or URL path>
---

# Story Editor

Collaborative ASCII-based story editing. You specify what it should look like via ASCII; I update the code.

## Request
$ARGUMENTS

## Workflow

1. **Locate story** - Find the story file from ID, URL path, or filename
2. **Show current ASCII** - Display the `expectedAscii` from the story
3. **You edit** - Modify the ASCII to show what you want (paste it back or edit in your editor)
4. **I update code** - Modify `initialMatrix` generation to produce your ASCII

## Story Locations

Stories live in `packages/core/src/model/*/stories/`:
- `01-depth/stories/` - Bathymetry (beach shape)
- `02-energy/stories/` - Wave energy propagation
- `03-velocity/stories/` - Wave speed
- `04-height/stories/` - Wave height (shoaling)
- `05-foam/stories/` - Foam dynamics

URL paths map to story files:
- `?page=01-depth` → `01-depth/stories/*.ts`
- `?page=02-energy` → `02-energy/stories/*.ts`

## ASCII Reference

| Char | Value | Meaning |
|------|-------|---------|
| `-`  | 0.00  | Zero/none |
| `1`  | 0.10  | Very low |
| `2`  | 0.20  | Low |
| `3`  | 0.30  | Low-medium |
| `4`  | 0.40  | Medium-low |
| `A`  | 0.50  | Medium |
| `B`  | 0.60  | Medium-high |
| `C`  | 0.70  | High |
| `D`  | 0.80  | Higher |
| `E`  | 0.90  | Very high |
| `F`  | 1.00  | Maximum |

## Example

```
User: /story 01-depth
Claude: Current ASCII for "Beach with Channel":
    t=0s
    FFDFFFDF
    ...

User: Here's what I want:
    t=0s
    FFFFFFFF
    DDDDDDDD
    ...

Claude: [Updates initialMatrix code to produce that pattern]
```
