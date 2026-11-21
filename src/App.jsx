import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useBudgets } from './budgetStore.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EnterBudgets from './pages/EnterBudgets.jsx'
import Compare from './pages/Compare.jsx'

const NAV = [
  { path: '/', label: 'Dashboard' },
  { path: '/enter', label: 'Enter Budgets' },
  { path: '/compare', label: 'Side-by-Side' },
]

function PeriodToggle() {
  const { period, setPeriod } = useBudgets()
  return (
    <ToggleButtonGroup
      aria-label="Amount period"
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={new Set([period])}
      onSelectionChange={(keys) => {
        const [key] = keys
        if (key) setPeriod(key)
      }}
    >
      <ToggleButton id="monthly">Monthly</ToggleButton>
      <ToggleButton id="annual">Annual</ToggleButton>
    </ToggleButtonGroup>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-separator bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="mr-4 text-lg font-semibold">Budget Comparator</h1>
          <nav className="flex flex-wrap gap-1" aria-label="Main">
            {NAV.map((item) => (
              <Button
                key={item.path}
                size="sm"
                variant={pathname === item.path ? 'primary' : 'ghost'}
                aria-current={pathname === item.path ? 'page' : undefined}
                onPress={() => navigate(item.path)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="ml-auto">
            <PeriodToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/enter" element={<EnterBudgets />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
