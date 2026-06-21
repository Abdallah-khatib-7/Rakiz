import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownLeft, Send, Users, Link2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiGetWallets, apiGetTransactions } from '@/lib/api'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', LBP: 'ل.ل', SAR: '﷼', AED: 'د.إ', GBP: '£',
}

const BALANCE_HIDDEN_KEY = 'rakiz_balance_hidden'

type Wallet = { id: number; currency: string; balance: string; is_locked: boolean }
type Transaction = {
  id: number
  amount: string
  currency: string
  direction: 'sent' | 'received'
  sender_name: string
  receiver_name: string
  note: string | null
  created_at: string
}

export default function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [balanceHidden, setBalanceHidden] = useState(() => localStorage.getItem(BALANCE_HIDDEN_KEY) === 'true')

  useEffect(() => {
    localStorage.setItem(BALANCE_HIDDEN_KEY, String(balanceHidden))
  }, [balanceHidden])

  useEffect(() => {
    let active = true
    Promise.all([apiGetWallets(accessToken), apiGetTransactions(accessToken, 6)])
      .then(([walletsRes, txRes]) => {
        if (!active) return
        setWallets(walletsRes.wallets)
        setTransactions(txRes.transactions)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [accessToken])

  const primaryWallet = wallets.find((w) => w.currency === 'USD') || wallets[0]
  const otherWallets = wallets.filter((w) => w.id !== primaryWallet?.id)

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-6xl">
      <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-4">
        {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Welcome back'}
      </p>

      {loading ? (
        <div className="h-32 flex items-center">
          <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
        </div>
      ) : primaryWallet ? (
        <div className="mb-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              onClick={() => setBalanceHidden((v) => !v)}
              className="font-bold text-[var(--color-bone)] leading-none cursor-pointer select-none transition-[filter] duration-200"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(56px, 9vw, 120px)',
                letterSpacing: '-0.03em',
                filter: balanceHidden ? 'blur(16px)' : 'none',
              }}
              title={balanceHidden ? 'Click to reveal' : 'Click to hide'}
            >
              {CURRENCY_SYMBOLS[primaryWallet.currency] || ''}
              {Number(primaryWallet.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-base text-[var(--color-bone-dim)]">{primaryWallet.currency}</span>
            <button
              onClick={() => setBalanceHidden((v) => !v)}
              className="text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition-colors"
              aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
            >
              {balanceHidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>
      ) : (
        <h1 className="text-4xl font-bold text-[var(--color-bone)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          No wallet yet
        </h1>
      )}

      {error && (
        <div className="p-4 mb-8 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg max-w-lg">
          {error}
        </div>
      )}

      {otherWallets.length > 0 && (
        <div className="flex items-center gap-6 flex-wrap mb-12 pb-8 border-b border-[var(--color-line)]">
          {otherWallets.map((w) => (
            <div key={w.id} className="flex items-baseline gap-1.5">
              <span className="font-mono text-sm text-[var(--color-bone-dim)]">{w.currency}</span>
              <span
                className="font-mono text-sm text-[var(--color-bone)] transition-[filter] duration-200"
                style={{ filter: balanceHidden ? 'blur(6px)' : 'none' }}
              >
                {CURRENCY_SYMBOLS[w.currency] || ''}
                {Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-16">
        <Link
          to="/wallet"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold transition-transform hover:scale-105"
        >
          <Send className="size-4" />
          Send
        </Link>
        <Link
          to="/splits"
          className="flex items-center gap-2 px-6 py-3 text-[var(--color-bone)] text-sm font-semibold transition-colors hover:text-[var(--color-emerald-bright)]"
        >
          <Users className="size-4" />
          Split a bill
        </Link>
        <Link
          to="/links"
          className="flex items-center gap-2 px-6 py-3 text-[var(--color-bone)] text-sm font-semibold transition-colors hover:text-[var(--color-emerald-bright)]"
        >
          <Link2 className="size-4" />
          Create a link
        </Link>
      </div>

      <div className="flex items-baseline justify-between mb-6">
        <h2
          className="text-2xl font-bold text-[var(--color-bone)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Activity
        </h2>
        <Link to="/wallet" className="text-sm text-[var(--color-emerald-bright)] hover:underline font-medium">
          View all
        </Link>
      </div>

      {loading ? (
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      ) : transactions.length === 0 ? (
        <p className="text-[var(--color-bone-dim)] text-sm py-8">No transactions yet.</p>
      ) : (
        <div>
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center justify-between py-5 ${i > 0 ? 'border-t border-[var(--color-line)]' : ''}`}
            >
              <div className="flex items-center gap-4">
                {tx.direction === 'received' ? (
                  <ArrowDownLeft className="size-4 text-[var(--color-emerald-bright)] flex-shrink-0" />
                ) : (
                  <ArrowUpRight className="size-4 text-[var(--color-bone-dim)] flex-shrink-0" />
                )}
                <div>
                  <div
                    className="text-base font-semibold text-[var(--color-bone)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {tx.direction === 'received' ? tx.sender_name : tx.receiver_name}
                  </div>
                  <div className="text-xs text-[var(--color-bone-dim)] font-mono">
                    {tx.note || (tx.direction === 'received' ? 'received' : 'sent')}
                  </div>
                </div>
              </div>
              <div
                className={`font-mono text-base transition-[filter] duration-200 ${
                  tx.direction === 'received' ? 'text-[var(--color-emerald-bright)]' : 'text-[var(--color-bone)]'
                }`}
                style={{ filter: balanceHidden ? 'blur(5px)' : 'none' }}
              >
                {tx.direction === 'received' ? '+' : '-'}
                {CURRENCY_SYMBOLS[tx.currency] || ''}
                {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}