import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')

    if (!accessToken) {
      navigate('/login?oauth=failed')
      return
    }

    // we have the access token but not the user object yet — fetch it
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        useAuthStore.getState().setAuth(accessToken, data.user)
        navigate('/dashboard')
      })
      .catch(() => {
        navigate('/login?oauth=failed')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-void)]">
      <p className="text-[var(--color-bone-dim)] font-mono text-sm tracking-wide">Signing you in...</p>
    </div>
  )
}