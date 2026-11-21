const currency = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
const currencyCompact = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatMoney = (n) => currency.format(Math.round(n))
export const formatMoneyCompact = (n) => currencyCompact.format(n)

export function formatSignedMoney(n) {
  const rounded = Math.round(n)
  if (rounded === 0) return formatMoney(0)
  return (rounded > 0 ? '+' : '−') + formatMoney(Math.abs(rounded))
}

export function formatPercentChange(a, b) {
  if (a === 0) return b === 0 ? '0%' : '—'
  const pct = ((b - a) / Math.abs(a)) * 100
  const r = Math.round(pct * 10) / 10
  return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(1) + '%'
}
