# Combination Lock Demo Restart Plan

## Goal
Build a clean, minimalist lock-gate interaction inspired by Apple/Linear/1Password patterns, with reliable interaction and clear visual hierarchy.

## Scope
- Single active dial at a time.
- Smooth dial spin interaction with drag and wheel support.
- Drag-to-unlock control that only activates when the full combination matches.
- Left/right vault doors slide open on successful unlock.
- Light mode as default.
- Design tokens and component styles centralized in one stylesheet (no inline design-token values in component files).

## Implementation Steps
1. Define design tokens in `src/styles.css` (`:root` vars for colors, radii, shadows, motion durations).
2. Add semantic utility classes in `src/styles.css` for:
   - page background
   - lock panel shell
   - dial window
   - slider track/thumb
   - door panels
3. Implement dial state machine in `src/routes/index.tsx`:
   - active dial index
   - turn state per dial
   - derived visible digit
   - combo validation
4. Implement interactions:
   - dial step via drag, wheel, and keyboard/buttons
   - next/prev dial navigation
   - drag-to-unlock threshold + spring reset
5. Implement unlock sequence:
   - status update to unlocked
   - doors animate open left/right
   - gated content revealed
6. Add verification checklist:
   - readable in light mode
   - dials always visible and interactive
   - unlock only possible with matching code
   - mobile and desktop sanity check

## Validation
- Run `bun --bun run dev` and manually verify flow.
- Run `bun --bun run build` to ensure production compile passes.
