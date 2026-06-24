import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShieldAlert, Users, TrendingUp, Check, X, Lock, Unlock, Ban, Sparkles, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  apiAdminGetUsers,
  apiAdminGetUserDetail,
  apiAdminSetUserStatus,
  apiAdminGetFraudQueue,
  apiAdminReviewFraudFlag,
  apiAdminAdjustBalance,
  apiAdminGetRevenue,
  apiAdminExplainFraudFlag,
} from '@/lib/api'

const CURRENCIES = ['USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP']

type AdminUser = {
  id: number
  email: string
  full_name: string
  role: string
  status: string
  subscription_tier: string
  email_verified: boolean
  created_at: string
  last_login_at: string | null
}

type FraudFlag = {
  id: number
  user_id: number
  user_email: string
  user_name: string
  rule_triggered: string
  severity: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [tab, setTab] = useState<'overview' | 'users' | 'fraud'>('overview')

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-6xl">
      <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-6">
        Admin
      </p>

      <div className="flex gap-2 mb-10 border-b border-[var(--color-line)] pb-px">
        {([
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'fraud', label: 'Fraud queue', icon: ShieldAlert },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === key
                ? 'text-[var(--color-emerald-bright)] border-[var(--color-emerald-bright)]'
                : 'text-[var(--color-bone-dim)] border-transparent hover:text-[var(--color-bone)]'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab accessToken={accessToken} />}
      {tab === 'users' && <UsersTab accessToken={accessToken} />}
      {tab === 'fraud' && <FraudTab accessToken={accessToken} />}
    </div>
  )
}

function OverviewTab({ accessToken }: { accessToken: string | null }) {
  const [revenue, setRevenue] = useState<{
    users: { total: number; free: number; pro: number; business: number }
    transactions: { total: number; totalFeesCollected: number; last30Days: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiAdminGetRevenue(accessToken)
      .then(setRevenue)
      .finally(() => setLoading(false))
  }, [accessToken])

  if (loading) return <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
  if (!revenue) return null

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        <StatCard label="Total users" value={revenue.users.total} delay={0} />
        <StatCard label="Transactions" value={revenue.transactions.total} delay={0.05} />
        <StatCard label="Fees collected" value={`$${Number(revenue.transactions.totalFeesCollected).toFixed(2)}`} delay={0.1} />
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-bold text-[var(--color-bone)] mb-5" style={{ fontFamily: 'var(--font-display)' }}>
          Subscriptions
        </h2>
        <div className="space-y-4">
          {[
            { label: 'Free', value: revenue.users.free, color: 'var(--color-bone-dim)' },
            { label: 'Pro', value: revenue.users.pro, color: 'var(--color-emerald-bright)' },
            { label: 'Business', value: revenue.users.business, color: 'var(--color-bullion)' },
          ].map((tier) => {
            const pct = revenue.users.total > 0 ? (tier.value / revenue.users.total) * 100 : 0
            return (
              <div key={tier.label}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-[var(--color-bone)]">{tier.label}</span>
                  <span className="font-mono text-xs text-[var(--color-bone-dim)]">{tier.value} users</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full"
                    style={{ background: tier.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="font-mono text-xs text-[var(--color-bone-dim)]">
        {revenue.transactions.last30Days} transactions in the last 30 days
      </p>
    </div>
  )
}

function StatCard({ label, value, delay }: { label: string; value: number | string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
    >
      <div
        className="font-bold text-[var(--color-bone)] mb-1"
        style={{ fontFamily: 'var(--font-display)', fontSize: '32px' }}
      >
        {value}
      </div>
      <div className="font-mono text-xs uppercase tracking-wide text-[var(--color-bone-dim)]">{label}</div>
    </motion.div>
  )
}

function UsersTab({ accessToken }: { accessToken: string | null }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<{
    wallets: { id: number; currency: string; balance: string; is_locked: boolean }[]
    fraudFlags: { id: number; rule_triggered: string; severity: string; status: string; created_at: string }[]
  } | null>(null)
  const [adjustCurrency, setAdjustCurrency] = useState('USD')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [adjustError, setAdjustError] = useState('')

  const load = (s: string) => {
    setLoading(true)
    apiAdminGetUsers(accessToken, 1, s)
      .then((res) => setUsers(res.users))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
      setDetail(null)
      return
    }
    setExpandedId(id)
    const res = await apiAdminGetUserDetail(accessToken, id)
    setDetail({ wallets: res.wallets, fraudFlags: res.fraudFlags })
  }

  const handleStatusChange = async (id: number, status: string) => {
    await apiAdminSetUserStatus(accessToken, id, status)
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  }

  const handleAdjust = async (userId: number) => {
    setAdjustError('')
    setAdjusting(true)
    try {
      await apiAdminAdjustBalance(accessToken, userId, adjustCurrency, parseFloat(adjustAmount), adjustReason)
      const res = await apiAdminGetUserDetail(accessToken, userId)
      setDetail({ wallets: res.wallets, fraudFlags: res.fraudFlags })
      setAdjustAmount('')
      setAdjustReason('')
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Adjustment failed')
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="relative mb-8 max-w-sm">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-[var(--color-bone-dim)]" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-b border-[var(--color-line)] pl-6 pb-2 text-sm text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)]"
        />
      </form>

      {loading ? (
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      ) : (
        <div>
          {users.map((u, i) => (
            <div key={u.id} className={i > 0 ? 'border-t border-[var(--color-line)]' : ''}>
              <button onClick={() => toggleExpand(u.id)} className="w-full flex items-center justify-between py-4 text-left">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-bone)]">{u.full_name}</div>
                  <div className="text-xs text-[var(--color-bone-dim)] font-mono">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--color-bone-dim)] capitalize">{u.subscription_tier}</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-mono ${
                      u.status === 'active'
                        ? 'bg-[var(--color-emerald)]/15 text-[var(--color-emerald-bright)]'
                        : 'bg-red-950/30 text-red-400'
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {expandedId === u.id && detail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                    className="pb-6 pl-1"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      {u.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(u.id, 'frozen')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-line)] text-xs text-[var(--color-bone)]"
                        >
                          <Lock className="size-3" /> Freeze
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(u.id, 'active')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-xs font-semibold"
                        >
                          <Unlock className="size-3" /> Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(u.id, 'suspended')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-900/40 text-xs text-red-400"
                      >
                        <Ban className="size-3" /> Suspend
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 mb-5">
                      <div>
                        <p className="font-mono text-xs uppercase text-[var(--color-bone-dim)] mb-3">Wallets</p>
                        <div className="space-y-1.5">
                          {detail.wallets.map((w) => (
                            <div key={w.id} className="flex justify-between text-sm">
                              <span className="text-[var(--color-bone-dim)] font-mono">{w.currency}</span>
                              <span className="text-[var(--color-bone)] font-mono">{Number(w.balance).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="font-mono text-xs uppercase text-[var(--color-bone-dim)] mb-3">
                          Fraud flags ({detail.fraudFlags.length})
                        </p>
                        {detail.fraudFlags.length === 0 ? (
                          <p className="text-xs text-[var(--color-bone-dim)]">None</p>
                        ) : (
                          <div className="space-y-1.5">
                            {detail.fraudFlags.slice(0, 3).map((f) => (
                              <div key={f.id} className="text-xs text-[var(--color-bone-dim)]">
                                {f.rule_triggered} · {f.status}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] p-4">
                      <p className="font-mono text-xs uppercase text-[var(--color-bone-dim)] mb-3">Adjust balance</p>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <select
                          value={adjustCurrency}
                          onChange={(e) => setAdjustCurrency(e.target.value)}
                          className="bg-[var(--color-surface-raised)] border border-[var(--color-line)] rounded-lg px-2 py-1.5 text-xs font-mono text-[var(--color-bone)] outline-none"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c} className="bg-[var(--color-surface)]">{c}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="amount (use - to remove)"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          className="bg-[var(--color-surface-raised)] border border-[var(--color-line)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-bone)] outline-none w-40"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Reason (min 5 characters)"
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-line)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-bone)] outline-none mb-3"
                      />
                      {adjustError && <p className="text-xs text-red-400 mb-2">{adjustError}</p>}
                      <button
                        onClick={() => handleAdjust(u.id)}
                        disabled={adjusting || !adjustAmount || adjustReason.length < 5}
                        className="px-4 py-1.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-xs font-semibold disabled:opacity-40"
                      >
                        {adjusting ? 'Applying...' : 'Apply adjustment'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FraudTab({ accessToken }: { accessToken: string | null }) {
  const [flags, setFlags] = useState<FraudFlag[]>([])
  const [statusFilter, setStatusFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [explanation, setExplanation] = useState<{
    ledgerContext: string
    explanation: string
    recommendation: string
  } | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [explainError, setExplainError] = useState('')

  const load = (status: string) => {
    setLoading(true)
    apiAdminGetFraudQueue(accessToken, status)
      .then((res) => setFlags(res.flags))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(statusFilter)
    setExpandedId(null)
    setExplanation(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, statusFilter])

  const handleReview = async (id: number, status: string) => {
    await apiAdminReviewFraudFlag(accessToken, id, status)
    setFlags((prev) => prev.filter((f) => f.id !== id))
    if (expandedId === id) {
      setExpandedId(null)
      setExplanation(null)
    }
  }

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExplanation(null)
      return
    }
    setExpandedId(id)
    setExplanation(null)
    setExplainError('')
    setLoadingExplanation(true)
    try {
      const res = await apiAdminExplainFraudFlag(accessToken, id)
      setExplanation(res.explanation)
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Could not load explanation')
    } finally {
      setLoadingExplanation(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {['open', 'reviewing', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide transition-colors ${
              statusFilter === s
                ? 'bg-[var(--color-emerald-bright)] text-[var(--color-void)]'
                : 'border border-[var(--color-line)] text-[var(--color-bone-dim)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      ) : flags.length === 0 ? (
        <div className="py-16 text-center">
          <ShieldAlert className="size-7 text-[var(--color-bone-dim)] mx-auto mb-4" />
          <p className="text-[var(--color-bone-dim)] text-sm">No {statusFilter} flags.</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {flags.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className={i > 0 ? 'border-t border-[var(--color-line)]' : ''}
            >
              <button onClick={() => toggleExpand(f.id)} className="w-full flex items-center justify-between py-4 text-left">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-2 rounded-full flex-shrink-0 ${
                      f.severity === 'high' ? 'bg-red-400' : f.severity === 'medium' ? 'bg-[var(--color-bullion)]' : 'bg-[var(--color-bone-dim)]'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-[var(--color-bone)]">{f.rule_triggered}</div>
                    <div className="text-xs text-[var(--color-bone-dim)] font-mono">
                      {f.user_name} ({f.user_email}) · {new Date(f.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(statusFilter === 'open' || statusFilter === 'reviewing') && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleReview(f.id, 'resolved')}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--color-emerald-bright)] hover:underline"
                      >
                        <Check className="size-3.5" /> Resolve
                      </button>
                      <button
                        onClick={() => handleReview(f.id, 'dismissed')}
                        className="flex items-center gap-1 text-xs font-medium text-[var(--color-bone-dim)] hover:underline"
                      >
                        <X className="size-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                  {statusFilter !== 'open' && statusFilter !== 'reviewing' && (
                    <span className="font-mono text-xs text-[var(--color-bone-dim)]">{f.status}</span>
                  )}
                  <ChevronDown
                    className={`size-4 text-[var(--color-bone-dim)] transition-transform ${expandedId === f.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {expandedId === f.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                    className="pb-6 pl-5"
                  >
                    {loadingExplanation ? (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-bone-dim)] font-mono py-2">
                        <Sparkles className="size-3.5 animate-pulse" />
                        Analyzing incident...
                      </div>
                    ) : explainError ? (
                      <p className="text-xs text-red-400">{explainError}</p>
                    ) : explanation ? (
                      <div className="space-y-3 max-w-2xl">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-bone-dim)] mb-1">
                            Transaction
                          </p>
                          <p className="text-sm text-[var(--color-bone-dim)] font-mono">{explanation.ledgerContext}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-bone-dim)] mb-1">
                            AI explanation
                          </p>
                          <p className="text-sm text-[var(--color-bone)]">{explanation.explanation}</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bullion)]/10 border border-[var(--color-bullion)]/30">
                          <Sparkles className="size-3.5 text-[var(--color-bullion)] flex-shrink-0" />
                          <p className="text-sm text-[var(--color-bullion)] font-medium">{explanation.recommendation}</p>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}