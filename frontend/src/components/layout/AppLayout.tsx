import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from 'sonner'

export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-[#0f0f13]">
      <Sidebar />
      <main className="ml-60 flex-1 overflow-y-auto">
        <div className="min-h-screen p-8">
          <Outlet />
        </div>
      </main>
      <Toaster
        theme="dark"
        toastOptions={{
          style: { background: '#18181f', border: '1px solid #2a2a35', color: '#f9fafb' },
        }}
      />
    </div>
  )
}
