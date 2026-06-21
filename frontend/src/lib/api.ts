const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Login failed')
  }

  return data as { accessToken: string; user: Record<string, unknown> }
}

export async function apiRegister(email: string, password: string, fullName: string) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Registration failed')
  }

  return data as { message: string }
}

// every authenticated request goes through here — attaches the bearer token
// and, if the access token has expired, transparently refreshes it once via
// the httpOnly cookie before retrying, so callers never have to think about
// token expiry themselves
export async function apiFetch(path: string, accessToken: string | null, options: RequestInit = {}) {
  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

  let res = await doFetch(accessToken)

  if (res.status === 401) {
    const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (refreshRes.ok) {
      const refreshData = await refreshRes.json()
      const { useAuthStore } = await import('@/store/authStore')
      useAuthStore.getState().setAuth(refreshData.accessToken, refreshData.user)
      res = await doFetch(refreshData.accessToken)
    }
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export async function apiGetWallets(accessToken: string | null) {
  return apiFetch('/api/wallets', accessToken) as Promise<{
    wallets: { id: number; currency: string; balance: string; is_locked: boolean }[]
  }>
}

export async function apiGetTransactions(accessToken: string | null, limit = 5) {
  return apiFetch(`/api/wallets/transactions?limit=${limit}`, accessToken) as Promise<{
    transactions: {
      id: number
      amount: string
      currency: string
      direction: 'sent' | 'received'
      sender_name: string
      receiver_name: string
      note: string | null
      created_at: string
    }[]
  }>
}

export async function apiGetNotifications(accessToken: string | null, limit = 5) {
  return apiFetch(`/api/notifications?limit=${limit}`, accessToken) as Promise<{
    notifications: { id: number; title: string; body: string; is_read: boolean; created_at: string }[]
    unreadCount: number
  }>
}

export async function apiSendMoney(
  accessToken: string | null,
  params: { receiver_email: string; amount: number; currency: string; target_currency?: string; note?: string }
) {
  const idempotencyKey = `send-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return apiFetch('/api/wallets/send', accessToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      receiver_email: params.receiver_email,
      amount: params.amount,
      currency: params.currency,
      target_currency: params.target_currency,
      note: params.note,
    }),
  }) as Promise<{ transaction: Record<string, unknown> }>
}

export async function apiGetAllTransactions(accessToken: string | null, page = 1, limit = 20) {
  return apiFetch(`/api/wallets/transactions?page=${page}&limit=${limit}`, accessToken) as Promise<{
    transactions: {
      id: number
      amount: string
      currency: string
      converted_amount: string | null
      converted_currency: string | null
      direction: 'sent' | 'received'
      sender_name: string
      receiver_name: string
      note: string | null
      created_at: string
    }[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>
}