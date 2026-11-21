import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'budget-comparator:v1'

export const DEFAULT_CATEGORIES = {
  income: ['Salary / Wages', 'Bonuses & Commissions', 'Investment Income', 'Other Income'],
  expense: [
    'Housing (Rent / Mortgage)',
    'Utilities',
    'Groceries',
    'Transportation',
    'Insurance',
    'Health & Medical',
    'Debt Payments',
    'Savings & Investments',
    'Childcare & Education',
    'Dining Out',
    'Entertainment',
    'Personal Care',
    'Clothing',
    'Gifts & Donations',
    'Miscellaneous',
  ],
}

// Illustrative monthly amounts for "Load sample data": [Budget A, Budget B]
const SAMPLE_AMOUNTS = {
  'Salary / Wages': [6200, 7100],
  'Bonuses & Commissions': [300, 500],
  'Investment Income': [150, 150],
  'Other Income': [0, 200],
  'Housing (Rent / Mortgage)': [2100, 2600],
  Utilities: [280, 320],
  Groceries: [750, 820],
  Transportation: [600, 420],
  Insurance: [310, 340],
  'Health & Medical': [120, 150],
  'Debt Payments': [450, 300],
  'Savings & Investments': [600, 900],
  'Childcare & Education': [400, 400],
  'Dining Out': [300, 220],
  Entertainment: [180, 200],
  'Personal Care': [90, 90],
  Clothing: [150, 120],
  'Gifts & Donations': [100, 150],
  Miscellaneous: [120, 100],
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))

function buildDefaultState(withSample = false) {
  const categories = []
  for (const type of ['income', 'expense']) {
    for (const name of DEFAULT_CATEGORIES[type]) {
      const [a, b] = withSample ? (SAMPLE_AMOUNTS[name] ?? [0, 0]) : [0, 0]
      categories.push({ id: newId(), name, type, amounts: { a, b } })
    }
  }
  return {
    budgets: { a: 'Budget A', b: 'Budget B' },
    categories,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isValidState(parsed)) return parsed
    }
  } catch {
    // Corrupt or unavailable storage: fall back to defaults
  }
  return buildDefaultState()
}

function isValidState(s) {
  return (
    s &&
    typeof s.budgets?.a === 'string' &&
    typeof s.budgets?.b === 'string' &&
    Array.isArray(s.categories) &&
    s.categories.every(
      (c) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.name === 'string' &&
        (c.type === 'income' || c.type === 'expense') &&
        Number.isFinite(c.amounts?.a) &&
        Number.isFinite(c.amounts?.b),
    )
  )
}

const BudgetContext = createContext(null)

export function BudgetProvider({ children }) {
  const [state, setState] = useState(loadState)
  // Amounts are stored monthly; "annual" multiplies by 12 for display and entry
  const [period, setPeriod] = useState(() => localStorage.getItem(STORAGE_KEY + ':period') || 'monthly')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + ':period', period)
  }, [period])

  const factor = period === 'annual' ? 12 : 1

  const renameBudget = useCallback((key, name) => {
    setState((s) => ({ ...s, budgets: { ...s.budgets, [key]: name } }))
  }, [])

  const updateCategory = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }, [])

  const setAmount = useCallback((id, key, value) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === id ? { ...c, amounts: { ...c.amounts, [key]: value } } : c,
      ),
    }))
  }, [])

  const addCategory = useCallback((type) => {
    setState((s) => ({
      ...s,
      categories: [...s.categories, { id: newId(), name: 'New category', type, amounts: { a: 0, b: 0 } }],
    }))
  }, [])

  const removeCategory = useCallback((id) => {
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }))
  }, [])

  // Move a category to the array position currently held by another category of the same type.
  // Moving down lands after the target; moving up lands before it.
  const moveCategory = useCallback((id, targetId) => {
    setState((s) => {
      const from = s.categories.findIndex((c) => c.id === id)
      const to = s.categories.findIndex((c) => c.id === targetId)
      if (from < 0 || to < 0 || from === to || s.categories[from].type !== s.categories[to].type) return s
      const categories = [...s.categories]
      const [item] = categories.splice(from, 1)
      categories.splice(to, 0, item)
      return { ...s, categories }
    })
  }, [])

  const resetToDefaults = useCallback(() => setState(buildDefaultState()), [])
  const loadSample = useCallback(() => setState(buildDefaultState(true)), [])
  const clearAmounts = useCallback(() => {
    setState((s) => ({ ...s, categories: s.categories.map((c) => ({ ...c, amounts: { a: 0, b: 0 } })) }))
  }, [])

  const importState = useCallback((data) => {
    if (!isValidState(data)) throw new Error('This file is not a valid budget export.')
    setState(data)
  }, [])

  const totals = useMemo(() => {
    const t = { income: { a: 0, b: 0 }, expense: { a: 0, b: 0 } }
    for (const c of state.categories) {
      t[c.type].a += c.amounts.a
      t[c.type].b += c.amounts.b
    }
    return {
      income: { a: t.income.a * factor, b: t.income.b * factor },
      expense: { a: t.expense.a * factor, b: t.expense.b * factor },
      net: { a: (t.income.a - t.expense.a) * factor, b: (t.income.b - t.expense.b) * factor },
    }
  }, [state.categories, factor])

  const value = {
    ...state,
    period,
    setPeriod,
    factor,
    totals,
    renameBudget,
    updateCategory,
    setAmount,
    addCategory,
    removeCategory,
    moveCategory,
    resetToDefaults,
    loadSample,
    clearAmounts,
    importState,
  }

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBudgets() {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudgets must be used inside BudgetProvider')
  return ctx
}
