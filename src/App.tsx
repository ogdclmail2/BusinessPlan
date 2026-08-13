import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { HashRouter } from 'react-router-dom'
import BaseProfilesPage from './modules/base-profiles/BaseProfilesPage'
import BusinessPlanPage from './modules/business-plan/BusinessPlanPage'

const navItem = (label: string, to: string) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 text-sm rounded-md transition-colors ${
        isActive ? 'bg-signal text-white' : 'text-ink-600 hover:bg-ink-100'
      }`
    }
  >
    {label}
  </NavLink>
)

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-full flex flex-col">
        <header className="border-b border-ink-200 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-6">
            <span className="font-semibold tracking-tight text-ink-900">
              O&amp;G Planner
            </span>
            <nav className="flex gap-1">
              {navItem('Base Profiles', '/profiles')}
              {navItem('Business Plan', '/business-plan')}
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/business-plan" replace />} />
            <Route path="/profiles" element={<BaseProfilesPage />} />
            <Route path="/business-plan" element={<BusinessPlanPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
