import { useState, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiCreateSplit, apiGetSplits, apiGetSplit, apiSettleSplit } from '@/lib/api'

const CURRENCIES = ['USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP']
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', LBP: 'ل.ل', SAR: '﷼', AED: 'د.إ', GBP: '£',
}

type SplitSummary = {
  id: number
  created_by: number
  title: string
  total_amount: string
  currency: string
  split_type: string
  status: string
  creator_name: string
  created_at: string
}

type SplitMember = {
  id: number
  user_id: number
  share_amount: string
  share_percentage: string | null
  is_settled: boolean
  full_name: string
  email: string
}

type SplitDetail = SplitSummary & {
  creator_email: string
  settled_at: string | null
  members: SplitMember[]
}

export default function SplitsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)

  const [splits, setSplits] = useState<SplitSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<SplitDetail | null>(null)

  const [showCreate, setShowCreate] = useState(false)

  const loadSplits = () => {
    setLoading(true)
    apiGetSplits(accessToken, 1, 30)
      .then((res) => setSplits(res.splits))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSplits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }
    setExpandedId(id)
    const res = await apiGetSplit(accessToken, id)
    setExpandedDetail(res.split)
  }

  const handleSettle = async (splitId: number, currency: string) => {
    await apiSettleSplit(accessToken, splitId, currency)
    const res = await apiGetSplit(accessToken, splitId)
    setExpandedDetail(res.split)
    loadSplits()
  }

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-4xl">
      <div className="flex items-baseline justify-between mb-10">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)]">
          Splits
        </p>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold transition-transform hover:scale-105"
        >
          {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
          {showCreate ? 'Cancel' : 'New split'}
        </button>
      </div>

      {showCreate && (
        <CreateSplitForm
          accessToken={accessToken}
          onCreated={() => {
            setShowCreate(false)
            loadSplits()
          }}
        />
      )}

      <div className="mt-4">
        {loading ? (
          <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
        ) : splits.length === 0 ? (
          <p className="text-[var(--color-bone-dim)] text-sm py-8">No splits yet.</p>
        ) : (
          <div>
            {splits.map((s, i) => (
              <div key={s.id} className={i > 0 ? 'border-t border-[var(--color-line)]' : ''}>
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <div>
                    <div
                      className="text-lg font-semibold text-[var(--color-bone)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {s.title}
                    </div>
                    <div className="text-xs text-[var(--color-bone-dim)] font-mono">
                      {s.creator_name} · {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono text-xs px-2.5 py-1 rounded-full ${
                        s.status === 'settled'
                          ? 'bg-[var(--color-emerald)]/15 text-[var(--color-emerald-bright)]'
                          : 'bg-[var(--color-surface)] text-[var(--color-bone-dim)]'
                      }`}
                    >
                      {s.status}
                    </span>
                    <span
                      className="font-bold text-[var(--color-bone)]"
                      style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}
                    >
                      {CURRENCY_SYMBOLS[s.currency]}
                      {Number(s.total_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </button>

                {expandedId === s.id && expandedDetail && (
                  <div className="pb-6 pl-1">
                    {(() => {
                      const settledAmount = expandedDetail.members
                        .filter((m) => m.is_settled)
                        .reduce((sum, m) => sum + Number(m.share_amount), 0)
                      const totalAmount = Number(expandedDetail.total_amount)
                      const pct = totalAmount > 0 ? (settledAmount / totalAmount) * 100 : 0

                      return (
                        <div className="mb-4">
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="font-mono text-xs text-[var(--color-bone-dim)]">
                              {CURRENCY_SYMBOLS[s.currency]}
                              {settledAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} of{' '}
                              {CURRENCY_SYMBOLS[s.currency]}
                              {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} settled
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-emerald-bright)] transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })()}
                    <div className="space-y-2">
                      {expandedDetail.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-2 rounded-full ${
                                m.is_settled ? 'bg-[var(--color-emerald-bright)]' : 'bg-[var(--color-line)]'
                              }`}
                            />
                            <span className="text-sm text-[var(--color-bone)]">{m.full_name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-[var(--color-bone-dim)]">
                              {CURRENCY_SYMBOLS[s.currency]}
                              {Number(m.share_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            {m.is_settled ? (
                              <Check className="size-4 text-[var(--color-emerald-bright)]" />
                            ) : m.user_id === currentUser?.id ? (
                              <button
                                onClick={() => handleSettle(s.id, s.currency)}
                                className="text-xs font-semibold text-[var(--color-emerald-bright)] hover:underline"
                              >
                                Settle
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateSplitForm({
  accessToken,
  onCreated,
}: {
  accessToken: string | null
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [splitType, setSplitType] = useState<'equal' | 'custom' | 'percentage'>('equal')
  const [members, setMembers] = useState<{ email: string; value: string }[]>([
    { email: '', value: '' },
    { email: '', value: '' },
  ])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const addMember = () => setMembers((m) => [...m, { email: '', value: '' }])
  const removeMember = (idx: number) => setMembers((m) => m.filter((_, i) => i !== idx))
  const updateMember = (idx: number, field: 'email' | 'value', val: string) =>
    setMembers((m) => m.map((mem, i) => (i === idx ? { ...mem, [field]: val } : mem)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        title,
        total_amount: parseFloat(totalAmount),
        currency,
        split_type: splitType,
        members: members
          .filter((m) => m.email.trim())
          .map((m) => {
            if (splitType === 'equal') return { email: m.email }
            if (splitType === 'percentage') return { email: m.email, percentage: parseFloat(m.value) }
            return { email: m.email, amount: parseFloat(m.value) }
          }),
      }
      await apiCreateSplit(accessToken, payload)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create split')
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
          value={totalAmount}
          onChange={(e) => {
            const v = e.target.value
            if (/^\d*\.?\d{0,2}$/.test(v)) setTotalAmount(v)
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

      <input
        type="text"
        placeholder="What's this split for?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full bg-transparent border-b border-[var(--color-line)] pb-3 mb-6 text-lg text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
      />

      <div className="flex gap-2 mb-6">
        {(['equal', 'custom', 'percentage'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSplitType(type)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide transition-colors ${
              splitType === type
                ? 'bg-[var(--color-emerald-bright)] text-[var(--color-void)]'
                : 'border border-[var(--color-line)] text-[var(--color-bone-dim)]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {members.map((m, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <input
              type="email"
              placeholder="member@email.com"
              value={m.email}
              onChange={(e) => updateMember(idx, 'email', e.target.value)}
              required
              className="flex-1 bg-transparent border-b border-[var(--color-line)] pb-2 text-sm text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
            />
            {splitType !== 'equal' && (
              <input
                type="text"
                inputMode="decimal"
                placeholder={splitType === 'percentage' ? '%' : 'amount'}
                value={m.value}
                onChange={(e) => updateMember(idx, 'value', e.target.value)}
                required
                className="w-24 bg-transparent border-b border-[var(--color-line)] pb-2 text-sm text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
              />
            )}
            {members.length > 2 && (
              <button type="button" onClick={() => removeMember(idx)} className="text-[var(--color-bone-dim)] hover:text-red-400">
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addMember}
          className="text-sm text-[var(--color-emerald-bright)] hover:underline font-medium"
        >
          + Add member
        </button>
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
        {submitting ? 'Creating...' : 'Create split'}
      </button>
    </form>
  )
}