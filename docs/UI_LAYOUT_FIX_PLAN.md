# UI Layout Fix Plan

Execution plan for fixing the mobile UI layout issues observed on a narrow
iPhone viewport (~390px wide), captured from the deployed site.

## 1. Observed issues

### 1.1 TopBar — title wraps to two lines
On mobile the header row contains: logo + title + action buttons
(`Reset`, `?`, `Share`). The flex children compete for horizontal space and
`Financial Life Tracker` wraps to two lines (`Financial Life` / `Tracker`),
which looks amateurish and wastes vertical space.

Root cause — `src/components/TopBar.tsx:32-54`: the title column has no
`min-w-0` / `truncate`, the three action buttons have `min-w-[44px]` each
plus a text-bearing Share button, leaving too little room for the title at
~390px widths.

### 1.2 TopBar — form grid misaligned
The 3-column grid (Birth Date / Mode / Inflation %) uses `items-end`. On iOS
Safari, `input[type="date"]` renders taller than a plain text input, which
pushes the Birth Date cell bottom lower. With `items-end`, the bottoms line
up but the label tops do not, producing a visible step between the labels.

Root cause — `src/components/TopBar.tsx:84`: `grid grid-cols-3 gap-2 items-end`
combined with inputs of non-uniform intrinsic height.

### 1.3 TopBar — date field cramped
At `grid-cols-3` with `gap-2` on a 390px viewport, the Birth Date column is
only ~110px wide. The locale date format `1. 1. 1985.` barely fits and the
field feels cramped next to the select and number input.

### 1.4 FIRE Insights — washed-out share button
The `𝕏 Share` button in the gradient header uses `bg-white/15 border-white/25`,
which blends with the purple gradient and looks semi-disabled.

Root cause — `src/components/FireInsights.tsx:130-138`.

### 1.5 Mobile header is visually noisy
Too many elements stacked without hierarchy: logo, title, status badge, three
buttons, then three form fields. Progressive disclosure should pull less-used
controls (Reset zoom, Help) out of the primary action strip.

## 2. Goals

- Title always fits on one line at ≥360px viewport.
- Form fields align perfectly at both label-top and input-bottom.
- Birth Date field has enough width to comfortably display locale dates.
- Share button in FIRE Insights reads as a clear call-to-action.
- No regression on tablet/desktop layouts (already working).

## 3. Implementation steps

### Step 1 — Fix TopBar mobile header row
File: `src/components/TopBar.tsx`

- Add `min-w-0 flex-1` to the logo/title column so it can shrink.
- Add `truncate` to the `h1` as a safety net.
- Collapse the three action buttons: keep Reset and Help as compact icon
  buttons (no extra `px-3`), shrink gaps between them.
- Keep the Share button prominent but tighten its padding on mobile.
- Move the status health badge onto its own line underneath the title where
  it already sits, but ensure it truncates if long.

### Step 2 — Fix TopBar form-grid alignment
File: `src/components/TopBar.tsx`

- Switch the mobile grid from `items-end` to `items-start`. All labels will
  then top-align; bottoms may differ by a pixel or two on iOS but that is
  invisible versus the current misalignment of labels.
- Add an explicit `h-11` (44px) to every input/select in the grid so the
  bottoms of the fields match and the iOS date input is normalized to the
  same height as siblings.
- Give the Birth Date cell `col-span-2` in a 4-column grid, then Mode and
  Inflation % take one column each. This gives the date the width it needs
  while keeping a clean single row.

### Step 3 — Brighten the FIRE Insights share button
File: `src/components/FireInsights.tsx`

- Bump background from `bg-white/15` to `bg-white/25` with
  `hover:bg-white/35` and a solid `border-white/60` border. The button will
  read as interactive against the gradient without clashing.

### Step 4 — No changes to desktop layout
All edits are scoped to the `lg:hidden` branch or shared classes that still
read correctly on desktop. The desktop grid at `src/components/TopBar.tsx:122`
is untouched.

## 4. Verification

- `pnpm build` — ensures TypeScript + bundler still pass.
- `pnpm test` — unit tests (calculations, store, validation) must still pass.
- Manual visual inspection at widths 360, 390, 414, 768, 1280 via
  browser devtools responsive mode.

## 5. Out of scope

- Redesigning the Configure Your Plan accordion (Level 3 disclosure is fine).
- Chart internals.
- Data entry forms.
- Any dark-mode work.
