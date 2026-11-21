# Handoff: Budget Comparator

Written 2026-11-21, when moving this work from the Claude desktop app to Claude Code in a terminal.

## What this is

A local web app that compares two budgets side by side. It has three pages:

- **Dashboard** (`#/`): summary cards (income, expenses, net) showing how the second budget differs from the first; a bar chart of income, expenses and net; a "Biggest differences" list; an "Accumulated net over time" chart; and expenses by category.
- **Enter Budgets** (`#/enter`): editable budget names; income and expense categories that can be renamed, added, removed and reordered by dragging; plus JSON export/import, load sample data, clear amounts, and reset to defaults.
- **Side-by-Side** (`#/compare`): a table with both budgets, the difference and the % change, plus subtotals, net, and the share of income left over.

## Stack

- Vite 8 + React 19, in JavaScript (not TypeScript)
- **HeroUI v3** (`@heroui/react` + `@heroui/styles`, from heroui.com) on Tailwind CSS v4
  - The v3 API uses compound components (`Card.Header`, `NumberField.Input`, `Slider.Track`…). It differs from v2, so check the type definitions in `node_modules/@heroui/react/dist/components/<name>/index.d.ts` instead of relying on memory.
  - Variants used: Button `primary | secondary | tertiary | outline | ghost | danger`; Chip `color: success | danger | …`, `variant: soft`.
- Recharts 3 for the charts
- react-router-dom 7 with `HashRouter`, so a static host needs no fallback route
- oxlint (`npm run lint`). The two remaining `only-export-components` warnings are expected.

## Files

| File | What it does |
|---|---|
| `src/budgetStore.jsx` | React context: state, localStorage saving, default and sample categories, every action (`setAmount`, `addCategory`, `moveCategory`, `importState`…), and totals |
| `src/format.js` | CAD money and percentage formatting |
| `src/App.jsx` | Header with the page buttons and the Monthly/Annual toggle; routes |
| `src/components/charts.jsx` | `TotalsChart`, `CategoryChart`, `AccumulatedDifferenceChart`, plus tooltips, legends and colours |
| `src/pages/Dashboard.jsx` | Dashboard; the time-window slider state lives here |
| `src/pages/EnterBudgets.jsx` | Entry page; per-section drag-and-drop with native HTML5 drag events |
| `src/pages/Compare.jsx` | Side-by-side table (HeroUI `Table`) |
| `Dockerfile`, `.dockerignore` | Two stages: build with node:22-alpine, then serve with nginx-unprivileged on port 8080 |
| `.claude/launch.json` | Dev server config for the desktop app's browser pane (port 5173, strict) |

## Data model and decisions

- State is `{ budgets: { a, b }, categories: [{ id, name, type: 'income'|'expense', amounts: { a, b } }] }`.
- **Amounts are stored as monthly figures.** The Monthly/Annual toggle multiplies by 12 for display and divides by 12 on entry. The accumulated chart always works from the monthly figures and ignores the toggle.
- localStorage keys: `budget-comparator:v1` (data), `…:v1:period`, `…:v1:window` (accumulated-chart window, 2–60 months, default 12).
- Category order is the order of the `categories` array. Drag-and-drop only works within a section, so income can't be dragged into expenses. The user asked for **no up/down arrow buttons**, so dragging is the only way to reorder.
- Currency is CAD. Amount fields use `currencyDisplay: 'narrowSymbol'` so they show `$` instead of `CA$`.
- Colours: budget A `#2a78d6` (blue), budget B `#eb6834` (orange), the gap band `#6250d6` (violet). These come from a validated colour-blind-safe palette. Good/bad changes are green/red and always come with ▲/▼ arrows.
- "Good" direction: more income is good and more spending is bad, including in "Savings & Investments" (see open items).
- Every on-screen label uses the budget names the user entered. No "A"/"B" labels should appear in the UI.

## How to run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # outputs to dist/
npm run lint
```

Docker (verified working; image is about 93 MB):

```bash
docker build -t budget-comparator .
docker run -d -p 8080:8080 --name budget-comparator budget-comparator   # http://localhost:8080
docker rm -f budget-comparator   # stop and remove
```

## State at handoff

- A Docker container named `budget-comparator` is **running** on port 8080, with sample data loaded in its browser storage.
- A Vite dev server on port 5173 was started by the desktop app and may stop when that session closes.
- The folder is **not a git repository**, so nothing has been committed.
- The user's **real budget data** is in the desktop app's browser pane at `http://localhost:5173`. It is stored per browser and per address, so it won't appear in Chrome or at port 8080 unless exported and imported as JSON.

## Working agreements with the user

- **Never change the user's real budget data while testing.** Test at a different address (such as the Docker container at :8080), or back up and restore the data. An earlier test accidentally reordered their categories and had to be undone by hand.
- Make the smallest change that does the job, and match the existing style.
- Say what you chose rather than offering a menu. Ask at most one question at a time.

## Open items / ideas (not started)

- More savings is shown in red as "more spending". The user was asked whether to treat it as good, but hasn't answered yet.
- The accumulated chart is a straight line because amounts are the same every month. Showing one-off or seasonal costs would need amounts that can vary by month.
- No dark mode.
- Reordering isn't possible from the keyboard (the arrows were removed at the user's request).
- The JS bundle is about 1 MB, which triggers a Vite size warning. Code-splitting would fix it if that ever matters.
- `README.md` is still the Vite template text.
