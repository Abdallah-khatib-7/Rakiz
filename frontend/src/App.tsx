import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { WalletPage } from '@/pages/wallet/WalletPage'
import { LinksPage } from '@/pages/links/LinksPage'
import { PayLinkPage } from '@/pages/links/PayLinkPage'
import { RequestsPage } from '@/pages/requests/RequestsPage'
import { SplitsPage } from '@/pages/splits/SplitsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { AIPage } from '@/pages/ai/AIPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { SubscriptionsPage } from '@/pages/subscriptions/SubscriptionsPage'
import { AdminPage } from '@/pages/admin/AdminPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pay/:token" element={<PayLinkPage />} />

          {/* Protected app routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/links" element={<LinksPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/splits" element={<SplitsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/ai" element={<AIPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
