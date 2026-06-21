import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, Send } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiSendMoney, apiGetAllTransactions, apiGetWallets } from '@/lib/api'

const CURRENCIES = ['USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP']
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', LBP: 'ل.ل', SAR: '﷼', AED: 'د.إ', GBP: '£',
}

type Wallet = { id: number; currency: string; balance: string }
type Transaction = {
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
}

export default function WalletPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [receiverIdentifier, setReceiverIdentifier] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')

  const loadData = () => {
    setLoadingList(true)
    Promise.all([apiGetWallets(accessToken), apiGetAllTransactions(accessToken, 1, 30)])
      .then(([walletsRes, txRes]) => {
        setWallets(walletsRes.wallets)
        setTransactions(txRes.transactions)
      })
      .finally(() => setLoadingList(false))
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendError('')
    setSendSuccess('')
    setSending(true)
    try {
      await apiSendMoney(accessToken, {
        receiver_identifier: receiverIdentifier,
        amount: parseFloat(amount),
        currency,
        note: note || undefined,
      })
      setSendSuccess(`Sent ${CURRENCY_SYMBOLS[currency]}${amount} to ${receiverIdentifier}`)
      setReceiverIdentifier('')
      setAmount('')
      setNote('')
      loadData()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const currentWallet = wallets.find((w) => w.currency === currency)

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-6xl">
      <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-8">
        Send money
      </p>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 mb-16">
        <form onSubmit={handleSend}>
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="font-bold text-[var(--color-bone)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 7vw, 88px)' }}
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
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 7vw, 88px)' }}
            />
          </div>

          <div className="flex items-center gap-3 mb-10">
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
            {currentWallet && (
              <p className="font-mono text-xs text-[var(--color-bone-dim)]">
                {CURRENCY_SYMBOLS[currency]}
                {Number(currentWallet.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} available
              </p>
            )}
          </div>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-[var(--color-bone-dim)] mb-2">
                To — email or phone number
              </label>
              <input
                type="text"
                placeholder="recipient@email.com or +1234567890"
                value={receiverIdentifier}
                onChange={(e) => setReceiverIdentifier(e.target.value)}
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

          {sendError && (
            <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
              {sendError}
            </div>
          )}
          {sendSuccess && (
            <div className="p-3 mb-4 text-sm text-[var(--color-emerald-bright)] bg-[var(--color-emerald)]/10 border border-[var(--color-emerald)]/30 rounded-lg">
              {sendSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="size-4" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>

        <div className="hidden lg:block pt-4">
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-line)] p-8 sticky top-8">
            <p className="font-mono text-xs uppercase tracking-wide text-[var(--color-bone-dim)] mb-6">
              Your wallets
            </p>
            <div className="space-y-4">
              {wallets.map((w) => (
                <div key={w.id} className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-[var(--color-bone-dim)]">{w.currency}</span>
                  <span
                    className="font-bold text-[var(--color-bone)]"
                    style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}
                  >
                    {CURRENCY_SYMBOLS[w.currency] || ''}
                    {Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-6 pt-8 border-t border-[var(--color-line)]">
        <h2 className="text-2xl font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
          History
        </h2>
      </div>

      {loadingList ? (
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
                  <div className="text-base font-semibold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {tx.direction === 'received' ? tx.sender_name : tx.receiver_name}
                  </div>
                  <div className="text-xs text-[var(--color-bone-dim)] font-mono">
                    {tx.note || (tx.direction === 'received' ? 'received' : 'sent')} ·{' '}
                    {new Date(tx.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div
                className={`font-mono text-base ${
                  tx.direction === 'received' ? 'text-[var(--color-emerald-bright)]' : 'text-[var(--color-bone)]'
                }`}
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