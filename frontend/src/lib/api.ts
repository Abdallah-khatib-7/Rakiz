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
    } else {
      // refresh token itself is invalid/expired — there's no way to recover
      // without the user logging in again, so clear local state and send
      // them there directly instead of leaving the app in a broken,
      // half-authenticated state with confusing 401s everywhere
      const { useAuthStore } = await import('@/store/authStore')
      useAuthStore.getState().clearAuth()
      window.location.href = '/login?session=expired'
      throw new Error('Session expired')
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

export async function apiGetNotifications(accessToken: string | null, page = 1, limit = 30, unreadOnly = false) {
  return apiFetch(`/api/notifications?page=${page}&limit=${limit}&unread_only=${unreadOnly}`, accessToken) as Promise<{
    notifications: {
      id: number
      type: string
      title: string
      body: string | null
      is_read: boolean
      reference_id: number | null
      reference_type: string | null
      created_at: string
    }[]
    unreadCount: number
    pagination: { page: number; limit: number; total: number; pages: number }
  }>
}

export async function apiMarkNotificationRead(accessToken: string | null, id: number) {
  return apiFetch(`/api/notifications/${id}/read`, accessToken, { method: 'PATCH' })
}

export async function apiMarkAllNotificationsRead(accessToken: string | null) {
  return apiFetch('/api/notifications/read-all', accessToken, { method: 'PATCH' })
}

export async function apiSendMoney(
  accessToken: string | null,
  params: { receiver_identifier: string; amount: number; currency: string; target_currency?: string; note?: string }
) {
  const idempotencyKey = `send-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return apiFetch('/api/wallets/send', accessToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      receiver_identifier: params.receiver_identifier,
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


export async function apiCreateSplit(
  accessToken: string | null,
  params: {
    title: string
    total_amount: number
    currency: string
    split_type: 'equal' | 'custom' | 'percentage'
    members: { email: string; amount?: number; percentage?: number }[]
  }
) {
  return apiFetch('/api/splits', accessToken, {
    method: 'POST',
    body: JSON.stringify(params),
  }) as Promise<{ split: Record<string, unknown> }>
}

export async function apiGetSplits(accessToken: string | null, page = 1, limit = 20) {
  return apiFetch(`/api/splits?page=${page}&limit=${limit}`, accessToken) as Promise<{
    splits: {
      id: number
      created_by: number
      title: string
      total_amount: string
      currency: string
      split_type: string
      status: string
      creator_name: string
      created_at: string
    }[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>
}

export async function apiGetSplit(accessToken: string | null, id: number) {
  return apiFetch(`/api/splits/${id}`, accessToken) as Promise<{
    split: {
      id: number
      created_by: number
      title: string
      total_amount: string
      currency: string
      split_type: string
      status: string
      creator_name: string
      creator_email: string
      created_at: string
      settled_at: string | null
      members: {
        id: number
        user_id: number
        share_amount: string
        share_percentage: string | null
        is_settled: boolean
        full_name: string
        email: string
      }[]
    }
  }>
}

export async function apiSettleSplit(accessToken: string | null, splitId: number, currency: string) {
  const idempotencyKey = `settle-${splitId}-${Date.now()}`
  return apiFetch(`/api/splits/${splitId}/settle`, accessToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ currency }),
  }) as Promise<{ transaction: Record<string, unknown> }>
}


export async function apiCreateRequest(
  accessToken: string | null,
  params: { target_email: string; amount: number; currency: string; note?: string }
) {
  return apiFetch('/api/requests', accessToken, {
    method: 'POST',
    body: JSON.stringify(params),
  }) as Promise<{ request: Record<string, unknown> }>
}

export async function apiGetRequests(accessToken: string | null, type: 'all' | 'sent' | 'received' = 'all') {
  return apiFetch(`/api/requests?type=${type}&limit=30`, accessToken) as Promise<{
    requests: {
      id: number
      requester_id: number
      target_id: number
      amount: string
      currency: string
      note: string | null
      status: string
      expires_at: string
      created_at: string
      requester_name: string
      requester_email: string
      target_name: string
      target_email: string
    }[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>
}

export async function apiPayRequest(accessToken: string | null, id: number, currency: string) {
  const idempotencyKey = `pay-request-${id}-${Date.now()}`
  return apiFetch(`/api/requests/${id}/pay`, accessToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ currency }),
  }) as Promise<{ transaction: Record<string, unknown> }>
}

export async function apiDeclineRequest(accessToken: string | null, id: number) {
  return apiFetch(`/api/requests/${id}/decline`, accessToken, { method: 'POST' })
}

export async function apiCancelRequest(accessToken: string | null, id: number) {
  return apiFetch(`/api/requests/${id}/cancel`, accessToken, { method: 'POST' })
}


export async function apiCreateCheckout(accessToken: string | null, tier: 'pro' | 'business') {
  return apiFetch('/api/subscriptions/checkout', accessToken, {
    method: 'POST',
    body: JSON.stringify({ tier }),
  }) as Promise<{ url: string }>
}

export async function apiCreatePortalSession(accessToken: string | null) {
  return apiFetch('/api/subscriptions/portal', accessToken, {
    method: 'POST',
  }) as Promise<{ url: string }>
}

export async function apiGetUsage(accessToken: string | null) {
  return apiFetch('/api/users/usage', accessToken) as Promise<{
    tier: string
    sends: { used: number; limit: number | null }
    splits: { used: number; limit: number | null }
  }>
}

export async function apiCreateLink(
  accessToken: string | null,
  params: { amount?: number; currency: string; description?: string; is_single_use?: boolean; expires_in_hours?: number }
) {
  return apiFetch('/api/links', accessToken, {
    method: 'POST',
    body: JSON.stringify(params),
  }) as Promise<{ link: Record<string, unknown> }>
}

export async function apiGetLinks(accessToken: string | null) {
  return apiFetch('/api/links?limit=30', accessToken) as Promise<{
    links: {
      id: number
      token: string
      amount: string | null
      currency: string
      description: string | null
      is_single_use: boolean
      use_count: number
      expires_at: string | null
      created_at: string
    }[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>
}

export async function apiDeleteLink(accessToken: string | null, id: number) {
  return apiFetch(`/api/links/${id}`, accessToken, { method: 'DELETE' })
}

// public — no auth, used on the standalone pay page
export async function apiGetLinkByToken(token: string) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const res = await fetch(`${API_URL}/api/links/pay/${token}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Link not found')
  return data as {
    link: {
      token: string
      amount: string | null
      currency: string
      description: string | null
      owner_name: string
      is_single_use: boolean
      use_count: number
      expires_at: string | null
    }
  }
}

export async function apiPayLinkByToken(accessToken: string | null, token: string, amount: number, currency: string) {
  const idempotencyKey = `pay-link-${token}-${Date.now()}`
  return apiFetch(`/api/links/pay/${token}`, accessToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ amount, currency }),
  }) as Promise<{ transaction: Record<string, unknown> }>
}

export async function apiGenerateInsight(accessToken: string | null, month: string) {
  return apiFetch('/api/ai/insights/generate', accessToken, {
    method: 'POST',
    body: JSON.stringify({ month }),
  }) as Promise<{
    insight: {
      month: string
      total_sent: number
      total_received: number
      top_categories: string[]
      savings_suggestions: string[]
      summary_text: string
      anomalies_detected?: { description: string; reasoning: string }[]
    }
  }>
}

export async function apiGetInsight(accessToken: string | null, month: string) {
  return apiFetch(`/api/ai/insights/${month}`, accessToken) as Promise<{
    insight: {
      month: string
      total_sent: number
      total_received: number
      top_categories: string[]
      savings_suggestions: string[]
      summary_text: string
      anomalies_detected?: { description: string; reasoning: string }[]
    }
  }>
}

export async function apiDetectAnomalies(accessToken: string | null, month: string) {
  return apiFetch('/api/ai/anomalies', accessToken, {
    method: 'POST',
    body: JSON.stringify({ month }),
  }) as Promise<{ anomalies: { description: string; reasoning: string }[] }>
}

export async function apiSearchTransactions(accessToken: string | null, query: string) {
  return apiFetch('/api/ai/search', accessToken, {
    method: 'POST',
    body: JSON.stringify({ query }),
  }) as Promise<{
    results: {
      id: number
      amount: string
      currency: string
      note: string | null
      created_at: string
      sender_name: string
      receiver_name: string
      direction: 'sent' | 'received'
    }[]
  }>
}

export async function apiExchangeCurrency(
  accessToken: string | null,
  fromCurrency: string,
  toCurrency: string,
  amount: number
) {
  const idempotencyKey = `exchange-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return apiFetch('/api/wallets/exchange', accessToken, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from_currency: fromCurrency, to_currency: toCurrency, amount }),
  }) as Promise<{
    transaction: {
      transactionId: number
      ledgerEntryId: number
      amount: number
      currency: string
      convertedAmount: number | null
      convertedCurrency: string | null
      rate: number | null
    }
  }>
}

export async function apiCreateWallet(accessToken: string | null, currency: string) {
  return apiFetch('/api/wallets', accessToken, {
    method: 'POST',
    body: JSON.stringify({ currency }),
  }) as Promise<{ wallet: { id: number; currency: string; balance: string } }>
}


export async function apiGetSessions(accessToken: string | null) {
  return apiFetch('/api/users/sessions', accessToken) as Promise<{
    sessions: { id: number; ip: string | null; userAgent: string; createdAt: string; expiresAt: string }[]
  }>
}

export async function apiRevokeSession(accessToken: string | null, id: number) {
  return apiFetch(`/api/users/sessions/${id}`, accessToken, { method: 'DELETE' })
}

export async function apiRevokeAllSessions(accessToken: string | null) {
  return apiFetch('/api/users/sessions/revoke-all', accessToken, { method: 'POST' })
}

export async function apiUploadAvatar(accessToken: string | null, file: File) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await fetch(`${API_URL}/api/users/avatar`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Avatar upload failed')
  return data as { avatar_url: string }
}

export async function apiUpdateProfile(accessToken: string | null, params: { full_name?: string; phone?: string }) {
  return apiFetch('/api/users/profile', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(params),
  }) as Promise<{ user: Record<string, unknown> }>
}

export async function apiChangePassword(accessToken: string | null, currentPassword: string, newPassword: string) {
  return apiFetch('/api/users/change-password', accessToken, {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  }) as Promise<{ message: string }>
}


export async function apiAdminGetUsers(accessToken: string | null, page = 1, search = '', status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20', search })
  if (status) params.set('status', status)
  return apiFetch(`/api/admin/users?${params}`, accessToken) as Promise<{
    users: { id: number; email: string; full_name: string; role: string; status: string; subscription_tier: string; email_verified: boolean; created_at: string; last_login_at: string | null }[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>
}

export async function apiAdminGetUserDetail(accessToken: string | null, id: number) {
  return apiFetch(`/api/admin/users/${id}`, accessToken) as Promise<{
    user: Record<string, unknown>
    wallets: { id: number; currency: string; balance: string; is_locked: boolean }[]
    fraudFlags: { id: number; rule_triggered: string; severity: string; status: string; created_at: string }[]
  }>
}

export async function apiAdminSetUserStatus(accessToken: string | null, id: number, status: string) {
  return apiFetch(`/api/admin/users/${id}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function apiAdminGetFraudQueue(accessToken: string | null, status = 'open') {
  return apiFetch(`/api/admin/fraud-queue?status=${status}&limit=30`, accessToken) as Promise<{
    flags: { id: number; user_id: number; user_email: string; user_name: string; rule_triggered: string; severity: string; status: string; created_at: string }[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }>
}

export async function apiAdminReviewFraudFlag(accessToken: string | null, id: number, status: string) {
  return apiFetch(`/api/admin/fraud-queue/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function apiAdminAdjustBalance(accessToken: string | null, userId: number, currency: string, amount: number, reason: string) {
  return apiFetch(`/api/admin/users/${userId}/adjust-balance`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ currency, amount, reason }),
  })
}

export async function apiAdminGetRevenue(accessToken: string | null) {
  return apiFetch('/api/admin/revenue', accessToken) as Promise<{
    users: { total: number; free: number; pro: number; business: number }
    transactions: { total: number; totalFeesCollected: number; last30Days: number }
  }>
}

export async function apiAdminExplainFraudFlag(accessToken: string | null, id: number) {
  return apiFetch(`/api/admin/fraud-queue/${id}/explain`, accessToken) as Promise<{
    explanation: {
      rule: string
      severity: string
      ledgerContext: string
      explanation: string
      recommendation: string
    }
  }>
}