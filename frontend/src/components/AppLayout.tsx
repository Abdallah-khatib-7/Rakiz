import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Send, Users, Inbox, Link2, Sparkles, Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
  { to: '/wallet', label: 'Wallet', icon: Send },
  { to: '/splits', label: 'Splits', icon: Users },
  { to: '/requests', label: 'Requests', icon: Inbox },
  { to: '/links', label: 'Links', icon: Link2 },
  { to: '/ai', label: 'Insights', icon: Sparkles },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--color-void)]">
      <header className="flex items-center justify-between px-8 sm:px-12 py-6 border-b border-[var(--color-line)]">
        <NavLink to="/dashboard" className="text-xl font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
          RAKIZ
        </NavLink>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wide transition-colors ${
                  isActive ? 'text-[var(--color-emerald-bright)]' : 'text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <NavLink to="/notifications" className="text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition-colors">
            <Bell className="size-[18px]" />
          </NavLink>
          <NavLink to="/profile" className="font-mono text-xs text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition-colors">
            {user?.full_name?.split(' ')[0] || 'Account'}
          </NavLink>
          <button onClick={handleLogout} className="text-[var(--color-bone-dim)] hover:text-red-400 transition-colors">
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}