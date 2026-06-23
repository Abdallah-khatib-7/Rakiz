import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiGetLinkByToken, apiPayLinkByToken } from '@/lib/api'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', LBP: 'ل.ل', SAR: '﷼', AED: 'د.إ', GBP: '£',
}

export default function PayLinkPage() {
  const { token } = useParams<{ token: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [link, setLink] = useState<{
    token: string
    amount: string | null
    currency: string
    description: string | null
    owner_name: string
  } | null>(null)
  const [amountInput, setAmountInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (!token) return
    apiGetLinkByToken(token)
      .then((res) => setLink(res.link))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handlePay = async () => {
    if (!token || !link) return
    setError('')
    setPaying(true)
    try {
      const amount = link.amount ? parseFloat(link.amount) : parseFloat(amountInput)
      await apiPayLinkByToken(accessToken, token, amount, link.currency)
      setPaid(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-void)]">
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      </div>
    )
  }

  if (error && !link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-void)] px-6">
        <p className="text-[var(--color-bone-dim)] text-center">{error}</p>
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-void)] px-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
          className="w-16 h-16 rounded-full bg-[var(--color-emerald)]/15 flex items-center justify-center mb-6"
        >
          <Check className="size-8 text-[var(--color-emerald-bright)]" />
        </motion.div>
        <h1
          className="text-3xl font-bold text-[var(--color-bone)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Payment sent
        </h1>
        <p className="text-[var(--color-bone-dim)] text-sm">
          {link?.owner_name} will be notified.
        </p>
      </div>
    )
  }

  if (!link) return null

  const needsAmountInput = !link.amount

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-void)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <p className="text-center font-mono text-xs tracking-[0.2em] uppercase text-[var(--color-bullion)] mb-3">
          Pay {link.owner_name}
        </p>

        {link.amount ? (
          <div
            className="text-center font-bold text-[var(--color-bone)] mb-6"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 10vw, 72px)' }}
          >
            {CURRENCY_SYMBOLS[link.currency]}
            {Number(link.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        ) : (
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span
              className="font-bold text-[var(--color-bone)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '48px' }}
            >
              {CURRENCY_SYMBOLS[link.currency]}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => {
                const v = e.target.value
                if (/^\d*\.?\d{0,2}$/.test(v)) setAmountInput(v)
              }}
              className="bg-transparent border-none outline-none font-bold text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/40 text-center"
              style={{ fontFamily: 'var(--font-display)', fontSize: '48px', width: 200 }}
            />
          </div>
        )}

        {link.description && (
          <p className="text-center text-[var(--color-bone-dim)] text-sm mb-8">{link.description}</p>
        )}

        {error && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
            {error}
          </div>
        )}

        <motion.button
          onClick={handlePay}
          disabled={paying || (needsAmountInput && !amountInput)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold disabled:opacity-50"
        >
          {paying ? 'Sending...' : 'Pay now'}
        </motion.button>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-[var(--color-bone-dim)] text-xs font-mono">
          <ShieldCheck className="size-3.5" />
          Secured by Rakiz
        </div>

        {!accessToken && (
          <p className="text-center text-xs text-[var(--color-bone-dim)] mt-4">
            <a href="/login" className="text-[var(--color-emerald-bright)] hover:underline">
              Sign in
            </a>{' '}
            to complete this payment
          </p>
        )}
      </motion.div>
    </div>
  )
}