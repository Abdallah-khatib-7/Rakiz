import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, Link2, GitPullRequest, Split,
  Bell, Sparkles, Settings, LogOut, Shield, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/links', icon: Link2, label: 'Pay Links' },
  { to: '/requests', icon: GitPullRequest, label: 'Requests' },
  { to: '/splits', icon: Split, label: 'Splits' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/ai', icon: Sparkles, label: 'AI Insights' },
  { to: '/subscriptions', icon: CreditCard, label: 'Plans' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??'

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r border-[#2a2a35] bg-[#18181f]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#2a2a35]">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Rakiz</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-[#1f1f28]'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {user?.subscription_tier === 'premium' || user?.subscription_tier === 'pro' ? null : null}

        {/* Admin link — only visible to admins */}
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-2 border-t border-[#2a2a35] pt-4',
              isActive
                ? 'bg-amber-600/15 text-amber-400'
                : 'text-gray-500 hover:text-gray-200 hover:bg-[#1f1f28]'
            )
          }
        >
          <Shield className="h-4 w-4 shrink-0" />
          Admin
        </NavLink>
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-[#2a2a35] px-3 py-3 space-y-0.5">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-600/15 text-indigo-400'
                : 'text-gray-500 hover:text-gray-200 hover:bg-[#1f1f28]'
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </NavLink>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1f1f28] cursor-pointer group"
          onClick={handleLogout}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          </div>
          <LogOut className="h-4 w-4 text-gray-600 group-hover:text-red-400 transition-colors shrink-0" onClick={(e) => { e.stopPropagation(); handleLogout() }} />
        </div>
      </div>
    </aside>
  )
}
