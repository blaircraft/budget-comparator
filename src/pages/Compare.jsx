import { Card, Table } from '@heroui/react'
import { useBudgets } from '../budgetStore.jsx'
import { higherIsBetter } from '../categories.js'
import { SERIES_COLORS } from '../components/charts.jsx'
import { formatMoney, formatPercentChange, formatSignedMoney } from '../format.js'

/** Difference text colour: good = success, bad = danger. Paired with a ▲/▼ glyph so it is not colour-only. */
function Diff({ a, b, higherIsBetter }) {
  const diff = Math.round(b - a)
  if (diff === 0) return <span className="text-muted">—</span>
  const good = higherIsBetter ? diff > 0 : diff < 0
  return (
    <span className={good ? 'text-success' : 'text-danger'}>
      {diff > 0 ? '▲' : '▼'} {formatSignedMoney(diff)}
    </span>
  )
}

function buildRows(categories, totals, factor) {
  const rows = []
  for (const [type, title] of [
    ['income', 'Income'],
    ['expense', 'Expenses'],
  ]) {
    rows.push({ id: `${type}-heading`, kind: 'heading', label: title })
    for (const c of categories.filter((x) => x.type === type)) {
      rows.push({
        id: c.id,
        kind: 'item',
        label: c.name,
        a: c.amounts.a * factor,
        b: c.amounts.b * factor,
        higherIsBetter: higherIsBetter(c),
      })
    }
    rows.push({
      id: `${type}-total`,
      kind: 'total',
      label: `Total ${title.toLowerCase()}`,
      a: totals[type].a,
      b: totals[type].b,
      higherIsBetter: type === 'income',
    })
  }
  rows.push({
    id: 'net',
    kind: 'net',
    label: 'Net (surplus / deficit)',
    a: totals.net.a,
    b: totals.net.b,
    higherIsBetter: true,
  })
  return rows
}

export default function Compare() {
  const { budgets, categories, totals, factor, period } = useBudgets()
  const rows = buildRows(categories, totals, factor)

  const savingsRate = (k) => (totals.income[k] > 0 ? (totals.net[k] / totals.income[k]) * 100 : null)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Side-by-Side</h2>
        <p className="text-sm text-muted">
          {period === 'annual' ? 'Annual' : 'Monthly'} amounts. Difference is {budgets.b} minus {budgets.a}; green is
          better (more income, less spending), red is worse.
        </p>
      </div>

      <Card>
        <Card.Content>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Side-by-side budget comparison">
                <Table.Header>
                  <Table.Column isRowHeader>Category</Table.Column>
                  {['a', 'b'].map((k) => (
                    <Table.Column key={k} className="text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-sm" style={{ background: SERIES_COLORS[k] }} />
                        {budgets[k]}
                      </span>
                    </Table.Column>
                  ))}
                  <Table.Column className="text-right">Difference</Table.Column>
                  <Table.Column className="text-right">% change</Table.Column>
                </Table.Header>
                <Table.Body items={rows}>
                  {(row) =>
                    row.kind === 'heading' ? (
                      <Table.Row id={row.id}>
                        <Table.Cell className="pt-5 text-xs font-semibold uppercase tracking-wide text-muted">
                          {row.label}
                        </Table.Cell>
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                        <Table.Cell />
                      </Table.Row>
                    ) : (
                      <Table.Row
                        id={row.id}
                        className={row.kind === 'item' ? '' : row.kind === 'net' ? 'font-bold' : 'font-semibold'}
                      >
                        <Table.Cell className={row.kind === 'item' ? 'pl-6' : ''}>{row.label}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums">{formatMoney(row.a)}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums">{formatMoney(row.b)}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums">
                          <Diff a={row.a} b={row.b} higherIsBetter={row.higherIsBetter} />
                        </Table.Cell>
                        <Table.Cell className="text-right tabular-nums text-muted">
                          {formatPercentChange(row.a, row.b)}
                        </Table.Cell>
                      </Table.Row>
                    )
                  }
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {['a', 'b'].map((k) => {
          const rate = savingsRate(k)
          return (
            <Card key={k}>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <span className="inline-block size-2.5 rounded-sm" style={{ background: SERIES_COLORS[k] }} />
                  {budgets[k]}: share of income left over
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-3xl font-semibold tabular-nums">{rate === null ? '—' : `${rate.toFixed(1)}%`}</p>
                <p className="text-sm text-muted">
                  {formatMoney(totals.net[k])} net of {formatMoney(totals.income[k])} income
                </p>
              </Card.Content>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
