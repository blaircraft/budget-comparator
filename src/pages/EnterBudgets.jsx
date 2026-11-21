import { Button, Card, Input, Label, NumberField, TextField } from '@heroui/react'
import { useRef, useState } from 'react'
import { useBudgets } from '../budgetStore.jsx'
import { SERIES_COLORS } from '../components/charts.jsx'
import { formatMoney } from '../format.js'

const CURRENCY_FORMAT = { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 2 }

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}

function AmountField({ label, value, onChange }) {
  return (
    <NumberField
      aria-label={label}
      value={value}
      minValue={0}
      formatOptions={CURRENCY_FORMAT}
      onChange={(v) => onChange(Number.isFinite(v) ? v : 0)}
      fullWidth
    >
      <NumberField.Group>
        <NumberField.Input className="text-right tabular-nums" />
      </NumberField.Group>
    </NumberField>
  )
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {[5, 12, 19].flatMap((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  )
}

// Columns: drag handle | name | amount A | amount B | row actions
const ROW_GRID = 'grid grid-cols-[1.5rem_1fr_1fr_2.5rem] gap-2 md:grid-cols-[1.5rem_1fr_11rem_11rem_2.5rem] md:gap-3'

function CategorySection({ type, title }) {
  const { budgets, categories, factor, totals, updateCategory, setAmount, addCategory, removeCategory, moveCategory } =
    useBudgets()
  const rows = categories.filter((c) => c.type === type)
  const sectionTotals = totals[type]
  // Drag state is per section, so a row can only be dropped within its own section
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  const endDrag = () => {
    setDragId(null)
    setOverId(null)
  }

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between">
        <div>
          <Card.Title>{title}</Card.Title>
          <Card.Description>
            {rows.length} {rows.length === 1 ? 'category' : 'categories'}. Drag the handle to reorder.
          </Card.Description>
        </div>
        <Button size="sm" variant="secondary" onPress={() => addCategory(type)}>
          + Add category
        </Button>
      </Card.Header>

      <Card.Content className="flex flex-col gap-2">
        <div className={`${ROW_GRID} hidden px-1 text-xs font-medium text-muted md:grid`}>
          <span />
          <span>Category</span>
          {['a', 'b'].map((k) => (
            <span key={k} className="flex items-center justify-end gap-1.5">
              <span className="inline-block size-2.5 rounded-sm" style={{ background: SERIES_COLORS[k] }} />
              <span className="truncate">{budgets[k]}</span>
            </span>
          ))}
          <span />
        </div>

        {rows.length === 0 && <p className="px-1 py-2 text-sm text-muted">No categories. Add one to get started.</p>}

        {rows.map((c) => (
          <div
            key={c.id}
            data-row
            onDragOver={(e) => {
              if (!dragId || dragId === c.id) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              if (overId !== c.id) setOverId(c.id)
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId) moveCategory(dragId, c.id)
              endDrag()
            }}
            className={`${ROW_GRID} items-center rounded-lg transition-shadow ${
              dragId === c.id ? 'opacity-40' : ''
            } ${overId === c.id ? 'ring-2 ring-accent' : ''}`}
          >
            <span
              draggable
              role="img"
              aria-label={`Drag to reorder ${c.name}`}
              title="Drag to reorder"
              className="flex h-9 cursor-grab items-center justify-center rounded text-muted hover:text-foreground active:cursor-grabbing"
              onDragStart={(e) => {
                setDragId(c.id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', c.id)
                const row = e.currentTarget.closest('[data-row]')
                if (row) e.dataTransfer.setDragImage(row, 16, 18)
              }}
              onDragEnd={endDrag}
            >
              <GripIcon />
            </span>
            <TextField
              aria-label="Category name"
              value={c.name}
              onChange={(name) => updateCategory(c.id, { name })}
              className="col-span-2 md:col-span-1"
              fullWidth
            >
              <Input />
            </TextField>
            <div className="col-start-2 md:col-start-auto">
              <AmountField
                label={`${c.name}, ${budgets.a}`}
                value={c.amounts.a * factor}
                onChange={(v) => setAmount(c.id, 'a', v / factor)}
              />
            </div>
            <AmountField
              label={`${c.name}, ${budgets.b}`}
              value={c.amounts.b * factor}
              onChange={(v) => setAmount(c.id, 'b', v / factor)}
            />
            <div className="col-start-4 row-start-1 flex justify-end md:col-start-auto md:row-start-auto">
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Remove ${c.name}`}
                onPress={() => removeCategory(c.id)}
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        ))}
      </Card.Content>

      <Card.Footer className={`${ROW_GRID} border-t border-separator pt-3 text-sm font-semibold`}>
        <span className="col-span-4 md:col-span-2">Total {title.toLowerCase()}</span>
        <span className="col-start-2 text-right tabular-nums md:col-start-auto">{formatMoney(sectionTotals.a)}</span>
        <span className="text-right tabular-nums">{formatMoney(sectionTotals.b)}</span>
      </Card.Footer>
    </Card>
  )
}

export default function EnterBudgets() {
  const { budgets, categories, period, renameBudget, resetToDefaults, clearAmounts, loadSample, importState } =
    useBudgets()
  const fileInput = useRef(null)
  const [message, setMessage] = useState(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ budgets, categories }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budgets.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      importState(JSON.parse(await file.text()))
      setMessage({ ok: true, text: `Imported ${file.name}.` })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message })
    }
  }

  const confirmThen = (text, action) => () => {
    if (window.confirm(text)) action()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Enter Budgets</h2>
        <p className="text-sm text-muted">
          Enter <strong>{period === 'annual' ? 'annual' : 'monthly'}</strong> amounts (switch with the toggle at the top
          right). Changes save automatically in this browser.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Budget names</Card.Title>
        </Card.Header>
        <Card.Content className="grid gap-4 sm:grid-cols-2">
          {['a', 'b'].map((k) => (
            <TextField key={k} value={budgets[k]} onChange={(v) => renameBudget(k, v)} fullWidth>
              <Label className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm" style={{ background: SERIES_COLORS[k] }} />
                {k === 'a' ? 'First budget' : 'Second budget'}
              </Label>
              <Input />
            </TextField>
          ))}
        </Card.Content>
      </Card>

      <CategorySection type="income" title="Income" />
      <CategorySection type="expense" title="Expenses" />

      <Card>
        <Card.Header>
          <Card.Title>Data</Card.Title>
          <Card.Description>Back up or restore your budgets, or start over.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onPress={exportJson}>
            Export JSON
          </Button>
          <Button size="sm" variant="secondary" onPress={() => fileInput.current?.click()}>
            Import JSON
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
          <Button
            size="sm"
            variant="secondary"
            onPress={confirmThen('Replace all data with sample budgets?', loadSample)}
          >
            Load sample data
          </Button>
          <Button size="sm" variant="outline" onPress={confirmThen('Set every amount to $0?', clearAmounts)}>
            Clear amounts
          </Button>
          <Button
            size="sm"
            variant="danger"
            onPress={confirmThen(
              'Reset everything to the default categories? Custom categories, names and amounts will be lost.',
              resetToDefaults,
            )}
          >
            Reset to defaults
          </Button>
        </Card.Content>
        {message && (
          <Card.Footer>
            <p className={`text-sm ${message.ok ? 'text-success' : 'text-danger'}`} role="status">
              {message.text}
            </p>
          </Card.Footer>
        )}
      </Card>
    </div>
  )
}
