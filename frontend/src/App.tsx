import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallback from './pages/AuthCallback'
import DashboardPage from './pages/DashboardPage'
import AppLayout from './components/AppLayout'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import WalletPage from './pages/WalletPage'
import SplitsPage from './pages/SplitsPage'
import RequestsPage from './pages/RequestsPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import ContactPage from './pages/ContactPage'
import BillingPage from './pages/BillingPage'
import LinksPage from './pages/LinksPage'
import PayLinkPage from './pages/PayLinkPage.tsx'
import AIPage from './pages/AIPage.tsx'
import NotificationsPage from './pages/NotificationsPage'
import { SocketProvider } from './context/SocketContext'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="grain-overlay" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pay/:token" element={<PayLinkPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/splits" element={<SplitsPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/links" element={<LinksPage />} />
              <Route path="/ai" element={<AIPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  )
}

export default App