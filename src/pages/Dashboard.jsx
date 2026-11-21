import { Button, Card, Chip, Label, Slider } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBudgets } from '../budgetStore.jsx'
import { higherIsBetter } from '../categories.js'
import { AccumulatedDifferenceChart, CategoryChart, SERIES_COLORS, TotalsChart } from '../components/charts.jsx'
import { formatMoney, formatPercentChange, formatSignedMoney } from '../format.js'

const WINDOW_KEY = 'budget-comparator:v1:window'
const MIN_WINDOW = 2
const MAX_WINDOW = 60

function describeWindow(months) {
  const years = months / 12
  if (months < 12) return `${months} months`
  const yearText = `${Number.isInteger(years) ? years : years.toFixed(1)} ${years === 1 ? 'year' : 'years'}`
  return Number.isInteger(years) ? yearText : `${months} months (${yearText})`
}

function SeriesValue({ seriesKey, name, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block size-2.5 shrink-0 rounded-sm" style={{ background: SERIES_COLORS[seriesKey] }} />
      <span className="truncate text-sm text-muted">{name}</span>
      <span className="ml-auto text-lg font-semibold tabular-nums">{formatMoney(value)}</span>
    </div>
  )
}

/** For income and net, higher is better; for expenses, lower is better. */
function DiffChip({ a, b, higherIsBetter }) {
  const diff = Math.round(b - a)
  if (diff === 0) {
    return (
      <Chip size="sm" variant="soft">
        No difference
      </Chip>
    )
  }
  const good = higherIsBetter ? diff > 0 : diff < 0
  return (
    <Chip size="sm" variant="soft" color={good ? 'success' : 'danger'}>
      {diff > 0 ? '▲' : '▼'} {formatSignedMoney(diff)} ({formatPercentChange(a, b)})
    </Chip>
  )
}

function StatCard({ title, values, budgets, higherIsBetter }) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        <SeriesValue seriesKey="a" name={budgets.a} value={values.a} />
        <SeriesValue seriesKey="b" name={budgets.b} value={values.b} />
      </Card.Content>
      <Card.Footer className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>
          {budgets.b} vs {budgets.a}
        </span>
        <DiffChip a={values.a} b={values.b} higherIsBetter={higherIsBetter} />
      </Card.Footer>
    </Card>
  )
}

export default function Dashboard() {
  const { budgets, categories, totals, factor, period, loadSample } = useBudgets()
  const navigate = useNavigate()
  const [windowMonths, setWindowMonths] = useState(() => {
    const saved = Number(localStorage.getItem(WINDOW_KEY))
    return saved >= MIN_WINDOW && saved <= MAX_WINDOW ? saved : 12
  })

  useEffect(() => {
    localStorage.setItem(WINDOW_KEY, String(windowMonths))
  }, [windowMonths])

  const hasData = categories.some((c) => c.amounts.a !== 0 || c.amounts.b !== 0)

  const totalsData = [
    { label: 'Income', a: totals.income.a, b: totals.income.b },
    { label: 'Expenses', a: totals.expense.a, b: totals.expense.b },
    { label: 'Net', a: totals.net.a, b: totals.net.b },
  ]

  const expenseData = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense' && (c.amounts.a !== 0 || c.amounts.b !== 0))
        .map((c) => ({ label: c.name, a: c.amounts.a * factor, b: c.amounts.b * factor }))
        .sort((x, y) => Math.max(y.a, y.b) - Math.max(x.a, x.b)),
    [categories, factor],
  )

  const biggestChanges = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, diff: (c.amounts.b - c.amounts.a) * factor }))
        .filter((c) => Math.round(c.diff) !== 0)
        .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff))
        .slice(0, 6),
    [categories, factor],
  )

  // Amounts are stored monthly, so the running totals are independent of the period toggle.
  // Month 0 is the starting point, before anything has accumulated.
  const monthlyNet = { a: totals.net.a / factor, b: totals.net.b / factor }
  const accumulatedData = Array.from({ length: windowMonths + 1 }, (_, m) => {
    const a = monthlyNet.a * m
    const b = monthlyNet.b * m
    return { month: m, a, b, gap: [Math.min(a, b), Math.max(a, b)] }
  })
  const windowEndDiff = Math.round((monthlyNet.b - monthlyNet.a) * windowMonths)

  if (!hasData) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <Card.Header>
          <Card.Title>No budget data yet</Card.Title>
          <Card.Description>
            Enter amounts for your two budgets to see them compared here, or load sample data to explore.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="justify-center gap-2">
          <Button onPress={() => navigate('/enter')}>Enter budget data</Button>
          <Button variant="secondary" onPress={loadSample}>
            Load sample data
          </Button>
        </Card.Footer>
      </Card>
    )
  }

  const periodLabel = period === 'annual' ? 'per year' : 'per month'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted">
            {budgets.a} vs {budgets.b}, amounts {periodLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={() => navigate('/enter')}>
            Edit budgets
          </Button>
          <Button size="sm" variant="secondary" onPress={() => navigate('/compare')}>
            View side-by-side
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total income" values={totals.income} budgets={budgets} higherIsBetter />
        <StatCard title="Total expenses" values={totals.expense} budgets={budgets} higherIsBetter={false} />
        <StatCard title="Net (surplus / deficit)" values={totals.net} budgets={budgets} higherIsBetter />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <Card.Header>
            <Card.Title>Income, expenses and net</Card.Title>
          </Card.Header>
          <Card.Content>
            <TotalsChart data={totalsData} budgets={budgets} />
          </Card.Content>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Biggest differences</Card.Title>
            <Card.Description>
              {budgets.b} compared with {budgets.a}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {biggestChanges.length === 0 ? (
              <p className="text-sm text-muted">The two budgets are identical.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-separator">
                {biggestChanges.map((c) => {
                  const good = higherIsBetter(c) ? c.diff > 0 : c.diff < 0
                  return (
                    <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
                      <span className="truncate">{c.name}</span>
                      <span className="text-xs text-muted">{c.type === 'income' ? 'Income' : 'Expense'}</span>
                      <Chip className="ml-auto shrink-0" size="sm" variant="soft" color={good ? 'success' : 'danger'}>
                        {c.diff > 0 ? '▲' : '▼'} {formatSignedMoney(c.diff)}
                      </Chip>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header className="flex-row flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0 flex-1 basis-80">
            <Card.Title>Accumulated net over time</Card.Title>
            <Card.Description>
              Running total of each budget&apos;s net (income minus expenses). The shaded band is the difference
              between them.
            </Card.Description>
          </div>
          <div className="shrink-0 sm:text-right">
            <div className="text-xs text-muted">After {describeWindow(windowMonths)}</div>
            <div className="text-lg font-semibold tabular-nums">
              {windowEndDiff === 0
                ? 'Even'
                : `${windowEndDiff > 0 ? budgets.b : budgets.a} ahead by ${formatMoney(Math.abs(windowEndDiff))}`}
            </div>
          </div>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Slider
            value={windowMonths}
            onChange={setWindowMonths}
            minValue={MIN_WINDOW}
            maxValue={MAX_WINDOW}
            step={1}
            className="w-full max-w-md"
          >
            <div className="flex items-center justify-between gap-2">
              <Label>Time window</Label>
              <Slider.Output className="text-sm tabular-nums">{describeWindow(windowMonths)}</Slider.Output>
            </div>
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
          <AccumulatedDifferenceChart data={accumulatedData} budgets={budgets} />
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Expenses by category</Card.Title>
          <Card.Description>Sorted by largest amount. Categories with no amount in either budget are hidden.</Card.Description>
        </Card.Header>
        <Card.Content>
          {expenseData.length === 0 ? (
            <p className="text-sm text-muted">No expenses entered yet.</p>
          ) : (
            <CategoryChart data={expenseData} budgets={budgets} />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
