import { useState, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiCreateRequest, apiGetRequests, apiPayRequest, apiDeclineRequest, apiCancelRequest } from '@/lib/api'

const CURRENCIES = ['USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP']
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', LBP: 'ل.ل', SAR: '﷼', AED: 'د.إ', GBP: '£',
}

type Request = {
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
}

export default function RequestsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [actionError, setActionError] = useState('')

  const loadRequests = (type: 'sent' | 'received') => {
    setLoading(true)
    apiGetRequests(accessToken, type)
      .then((res) => setRequests(res.requests))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRequests(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, tab])

  const handlePay = async (id: number, currency: string) => {
    setActionError('')
    try {
      await apiPayRequest(accessToken, id, currency)
      loadRequests(tab)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Payment failed')
    }
  }

  const handleDecline = async (id: number) => {
    await apiDeclineRequest(accessToken, id)
    loadRequests(tab)
  }

  const handleCancel = async (id: number) => {
    await apiCancelRequest(accessToken, id)
    loadRequests(tab)
  }

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-4xl">
      <div className="flex items-baseline justify-between mb-8">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)]">
          Requests
        </p>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold transition-transform hover:scale-105"
        >
          {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
          {showCreate ? 'Cancel' : 'New request'}
        </button>
      </div>

      {showCreate && (
        <CreateRequestForm
          accessToken={accessToken}
          onCreated={() => {
            setShowCreate(false)
            setTab('sent')
            loadRequests('sent')
          }}
        />
      )}

      <div className="flex gap-6 mb-8 border-b border-[var(--color-line)]">
        {(['received', 'sent'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === t
                ? 'text-[var(--color-emerald-bright)] border-[var(--color-emerald-bright)]'
                : 'text-[var(--color-bone-dim)] border-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
          {actionError}
        </div>
      )}

      {loading ? (
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      ) : requests.length === 0 ? (
        <p className="text-[var(--color-bone-dim)] text-sm py-8">No {tab} requests.</p>
      ) : (
        <div>
          {requests.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between py-5 ${i > 0 ? 'border-t border-[var(--color-line)]' : ''}`}
            >
              <div>
                <div
                  className="text-base font-semibold text-[var(--color-bone)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {tab === 'received' ? r.requester_name : r.target_name}
                </div>
                <div className="text-xs text-[var(--color-bone-dim)] font-mono">
                  {r.note || 'Payment request'} ·{' '}
                  <span
                    className={
                      r.status === 'paid'
                        ? 'text-[var(--color-emerald-bright)]'
                        : r.status === 'pending'
                          ? 'text-[var(--color-bullion)]'
                          : ''
                    }
                  >
                    {r.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className="font-bold text-[var(--color-bone)]"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}
                >
                  {CURRENCY_SYMBOLS[r.currency]}
                  {Number(r.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>

                {r.status === 'pending' && tab === 'received' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePay(r.id, r.currency)}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-xs font-semibold transition-transform hover:scale-105"
                    >
                      <Check className="size-3" />
                      Pay
                    </button>
                    <button
                      onClick={() => handleDecline(r.id)}
                      className="text-xs font-medium text-[var(--color-bone-dim)] hover:text-red-400"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {r.status === 'pending' && tab === 'sent' && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    className="text-xs font-medium text-[var(--color-bone-dim)] hover:text-red-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateRequestForm({
  accessToken,
  onCreated,
}: {
  accessToken: string | null
  onCreated: () => void
}) {
  const [targetEmail, setTargetEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiCreateRequest(accessToken, {
        target_email: targetEmail,
        amount: parseFloat(amount),
        currency,
        note: note || undefined,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10 pb-10 border-b border-[var(--color-line)]">
      <div className="flex items-baseline gap-2 mb-6">
        <span
          className="font-bold text-[var(--color-bone)]"
          style={{ fontFamily: 'var(--font-display)', fontSize: '40px' }}
        >
          {CURRENCY_SYMBOLS[currency]}
        </span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const v = e.target.value
            if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v)
          }}
          required
          className="bg-transparent border-none outline-none font-bold text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/40 flex-1 min-w-0"
          style={{ fontFamily: 'var(--font-display)', fontSize: '40px' }}
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-full px-3 py-1 font-mono text-xs text-[var(--color-bone)] cursor-pointer outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c} className="bg-[var(--color-surface)]">
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-5 mb-6">
        <div>
          <label className="block font-mono text-xs uppercase tracking-wide text-[var(--color-bone-dim)] mb-2">
            From
          </label>
          <input
            type="email"
            placeholder="their@email.com"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            required
            className="w-full bg-transparent border-b border-[var(--color-line)] pb-3 text-lg text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
          />
        </div>
        <div>
          <label className="block font-mono text-xs uppercase tracking-wide text-[var(--color-bone-dim)] mb-2">
            Note (optional)
          </label>
          <input
            type="text"
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={512}
            className="w-full bg-transparent border-b border-[var(--color-line)] pb-3 text-lg text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-7 py-3 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold transition-transform hover:scale-105 disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send request'}
      </button>
    </form>
  )
}