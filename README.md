# budget-comparator

Create and compare two budgets side-by-side.

Budget Comparator is a small web app that runs entirely in your browser. Enter two monthly budgets — for example, your current budget and a planned one — and see how they differ in income, expenses, and what's left over. Nothing is sent to a server; your data is saved in your browser's local storage.

## Features

- **Dashboard** — summary cards for income, expenses, and net showing how the second budget differs from the first; a bar chart of the totals; a "Biggest differences" list; an "Accumulated net over time" chart with an adjustable window (2–60 months); and expenses by category.
- **Enter Budgets** — name each budget, then enter amounts for income and expense categories. Categories can be renamed, added, removed, and reordered by dragging.
- **Side-by-Side** — a table of both budgets with the difference and % change for every category, plus subtotals, net, and the share of income left over.
- **Monthly / Annual toggle** — view and enter amounts per month or per year.
- **Import / export** — save your budgets to a JSON file and load them back, e.g. to move them to another browser.
- **Sample data** — load example budgets to try the app out.

Amounts are in Canadian dollars (CAD). Increases and decreases are shown in green and red, always with ▲/▼ arrows, and the budget colours come from a colour-blind-safe palette.

## Getting started

Requires Node.js 22 or later (see `.nvmrc`).

```bash
npm install
npm run dev       # start the dev server at http://localhost:5173
```

Other scripts:

```bash
npm run build     # production build, output to dist/
npm run preview   # serve the production build locally
npm run lint      # run oxlint
```

## Running with Docker

The `Dockerfile` builds the app and serves the static files with an unprivileged nginx on port 8080.

```bash
docker build -t budget-comparator .
docker run -d -p 8080:8080 --name budget-comparator budget-comparator
# open http://localhost:8080

docker rm -f budget-comparator    # stop and remove
```

The app uses hash-based routes (`#/`, `#/enter`, `#/compare`), so it works on any static host without extra server configuration.

## Your data

Budgets are stored in the browser's `localStorage`, which is separate for each browser and each address. Budgets entered at `http://localhost:5173` won't appear at `http://localhost:8080` or in a different browser. Use **Export JSON** and **Import JSON** on the Enter Budgets page to move them.

Amounts are stored as monthly figures; the Annual view multiplies by 12.

## Tech stack

- [React 19](https://react.dev) + [Vite](https://vite.dev), in JavaScript
- [HeroUI v3](https://heroui.com) on [Tailwind CSS v4](https://tailwindcss.com)
- [Recharts](https://recharts.org) for charts
- [React Router](https://reactrouter.com) with `HashRouter`
- [oxlint](https://oxc.rs) for linting

## Project layout

```
src/
  budgetStore.jsx        state, localStorage persistence, actions, totals
  format.js              currency and percentage formatting
  App.jsx                header, navigation, Monthly/Annual toggle, routes
  components/charts.jsx  chart components
  pages/
    Dashboard.jsx
    EnterBudgets.jsx
    Compare.jsx
```

## License

[MIT](LICENSE)
