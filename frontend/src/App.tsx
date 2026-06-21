import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallback from './pages/AuthCallback'
import DashboardPage from './pages/DashboardPage'
import AppLayout from './components/AppLayout'
import WalletPage from './pages/WalletPage'
import SplitsPage from './pages/SplitsPage'

function App() {
  return (
    <BrowserRouter>
      <div className="grain-overlay" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/splits" element={<SplitsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App