import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney, formatMoneyCompact, formatSignedMoney } from '../format.js'

// Validated categorical slots 1 & 2 (light mode); also defined in index.css
export const SERIES_COLORS = { a: '#2a78d6', b: '#eb6834' }
const AXIS_TEXT = '#6b6b68'
const GRID = '#e6e5e1'
// Shaded gap between the budgets: violet (categorical slot 7) so it isn't mistaken for either budget's colour
const DIFF_COLOR = '#6250d6'

function ComparisonTooltip({ active, payload, label, budgets }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-separator bg-overlay px-3 py-2 text-sm shadow-md">
      <div className="mb-1 font-medium">{label}</div>
      {['a', 'b'].map((k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: SERIES_COLORS[k] }} />
          <span className="text-muted">{budgets[k]}</span>
          <span className="ml-auto pl-4 tabular-nums">{formatMoney(row[k])}</span>
        </div>
      ))}
      <div className="mt-1 border-t border-separator pt-1 text-muted tabular-nums">
        Difference: {formatSignedMoney(row.b - row.a)}
      </div>
    </div>
  )
}

function LegendContent({ budgets }) {
  return (
    <div className="flex justify-center gap-4 pt-2 text-sm">
      {['a', 'b'].map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: SERIES_COLORS[k] }} />
          {budgets[k]}
        </span>
      ))}
    </div>
  )
}

/** Vertical grouped bars: Income / Expenses / Net for both budgets. */
export function TotalsChart({ data, budgets }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: AXIS_TEXT, fontSize: 13 }} />
        <YAxis
          tickFormatter={formatMoneyCompact}
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
          width={64}
        />
        <ReferenceLine y={0} stroke={AXIS_TEXT} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ComparisonTooltip budgets={budgets} />} />
        <Legend content={<LegendContent budgets={budgets} />} />
        <Bar dataKey="a" name={budgets.a} fill={SERIES_COLORS.a} radius={[4, 4, 0, 0]} maxBarSize={56} />
        <Bar dataKey="b" name={budgets.b} fill={SERIES_COLORS.b} radius={[4, 4, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Horizontal grouped bars, one row per category. */
export function CategoryChart({ data, budgets }) {
  const height = Math.max(160, data.length * 44 + 60)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        barGap={2}
        barCategoryGap="22%"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis
          type="number"
          tickFormatter={formatMoneyCompact}
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={170}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
        />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ComparisonTooltip budgets={budgets} />} />
        <Legend verticalAlign="top" content={<LegendContent budgets={budgets} />} />
        <Bar dataKey="a" name={budgets.a} fill={SERIES_COLORS.a} radius={[0, 4, 4, 0]} maxBarSize={16} />
        <Bar dataKey="b" name={budgets.b} fill={SERIES_COLORS.b} radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function formatMonthTick(m) {
  if (m === 0) return 'Start'
  return m % 12 === 0 ? `${m / 12} yr` : `${m} mo`
}

// Pick a tick spacing that keeps roughly 12 or fewer labels on the axis
function monthTicks(months) {
  const step = [1, 2, 3, 6, 12].find((s) => months / s <= 12) ?? 12
  const ticks = []
  for (let m = 0; m <= months; m += step) ticks.push(m)
  if (ticks[ticks.length - 1] !== months) ticks.push(months)
  return ticks
}

function AccumulatedTooltip({ active, payload, budgets }) {
  if (!active || !payload?.length) return null
  const { month, a, b } = payload[0].payload
  const diff = Math.round(b - a)
  const leader = diff > 0 ? budgets.b : budgets.a
  return (
    <div className="rounded-lg border border-separator bg-overlay px-3 py-2 text-sm shadow-md">
      <div className="mb-1 font-medium">{month === 0 ? 'Start' : `After ${month} ${month === 1 ? 'month' : 'months'}`}</div>
      {['a', 'b'].map((k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: SERIES_COLORS[k] }} />
          <span className="text-muted">{budgets[k]}</span>
          <span className="ml-auto pl-4 tabular-nums">{formatMoney(k === 'a' ? a : b)}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2 border-t border-separator pt-1">
        <span className="inline-block size-2.5 rounded-sm" style={{ background: DIFF_COLOR, opacity: 0.35 }} />
        <span className="tabular-nums">{diff === 0 ? 'Even' : `${leader} ahead by ${formatMoney(Math.abs(diff))}`}</span>
      </div>
    </div>
  )
}

function AccumulatedLegend({ budgets }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm">
      {['a', 'b'].map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: SERIES_COLORS[k] }} />
          {budgets[k]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm" style={{ background: DIFF_COLOR, opacity: 0.25 }} />
        Difference
      </span>
    </div>
  )
}

/**
 * Running totals of each budget's net (income − expenses) month by month,
 * with the gap between the two lines shaded.
 */
export function AccumulatedDifferenceChart({ data, budgets }) {
  const months = data[data.length - 1]?.month ?? 0
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="month"
          type="number"
          domain={[0, months]}
          ticks={monthTicks(months)}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
          tickFormatter={formatMonthTick}
        />
        <YAxis
          tickFormatter={formatMoneyCompact}
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
          width={64}
        />
        <ReferenceLine y={0} stroke={AXIS_TEXT} />
        <Tooltip
          cursor={{ stroke: AXIS_TEXT, strokeDasharray: '3 3' }}
          content={<AccumulatedTooltip budgets={budgets} />}
        />
        <Legend content={<AccumulatedLegend budgets={budgets} />} />
        {/* Range area between the two running totals */}
        <Area
          type="linear"
          dataKey="gap"
          stroke="none"
          fill={DIFF_COLOR}
          fillOpacity={0.18}
          isAnimationActive={false}
          activeDot={false}
        />
        {['a', 'b'].map((k) => (
          <Line
            key={k}
            type="linear"
            dataKey={k}
            stroke={SERIES_COLORS[k]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: SERIES_COLORS[k] }}
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
