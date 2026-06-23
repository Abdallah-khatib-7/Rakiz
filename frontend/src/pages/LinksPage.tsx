import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Copy, Check, Trash2, Link2, Infinity as InfinityIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiCreateLink, apiGetLinks, apiDeleteLink } from '@/lib/api'

const CURRENCIES = ['USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP']
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', LBP: 'ل.ل', SAR: '﷼', AED: 'د.إ', GBP: '£',
}

type PaymentLink = {
  id: number
  token: string
  amount: string | null
  currency: string
  description: string | null
  is_single_use: boolean
  use_count: number
  expires_at: string | null
  created_at: string
}

export default function LinksPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const loadLinks = () => {
    setLoading(true)
    apiGetLinks(accessToken)
      .then((res) => setLinks(res.links))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLinks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const handleCopy = (link: PaymentLink) => {
    const url = `${window.location.origin}/pay/${link.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const handleDelete = async (id: number) => {
    await apiDeleteLink(accessToken, id)
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-4xl">
      <div className="flex items-baseline justify-between mb-10">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)]">
          Payment links
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold"
        >
          {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
          {showCreate ? 'Cancel' : 'New link'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <CreateLinkForm
              accessToken={accessToken}
              onCreated={() => {
                setShowCreate(false)
                loadLinks()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      ) : links.length === 0 ? (
        <div className="py-16 text-center">
          <Link2 className="size-8 text-[var(--color-bone-dim)] mx-auto mb-4" />
          <p className="text-[var(--color-bone-dim)] text-sm">No payment links yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {links.map((link, i) => (
            <LinkCard
              key={link.id}
              link={link}
              index={i}
              copied={copiedId === link.id}
              onCopy={() => handleCopy(link)}
              onDelete={() => handleDelete(link.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LinkCard({
  link,
  index,
  copied,
  onCopy,
  onDelete,
}: {
  link: PaymentLink
  index: number
  copied: boolean
  onCopy: () => void
  onDelete: () => void
}) {
  const isExpired = link.expires_at && new Date(link.expires_at) < new Date()
  const isUsedUp = link.is_single_use && link.use_count >= 1
  const isDead = isExpired || isUsedUp

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className={`relative rounded-2xl border p-6 overflow-hidden transition-shadow ${
        isDead
          ? 'border-[var(--color-line)] bg-[var(--color-surface)]/50 opacity-60'
          : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:shadow-[0_0_30px_rgba(0,210,122,0.08)]'
      }`}
    >
      {!isDead && (
        <motion.div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,210,122,0.12), transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="font-bold text-[var(--color-bone)]"
              style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}
            >
              {link.amount ? `${CURRENCY_SYMBOLS[link.currency]}${Number(link.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : 'Any amount'}
            </span>
          </div>
          <p className="text-sm text-[var(--color-bone-dim)]">
            {link.description || 'No description'}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-[var(--color-bone-dim)] hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="relative z-10 flex items-center gap-3 mb-4 font-mono text-xs text-[var(--color-bone-dim)]">
        {link.is_single_use ? (
          <span className="flex items-center gap-1">single-use{link.use_count >= 1 ? ' · used' : ''}</span>
        ) : (
          <span className="flex items-center gap-1">
            <InfinityIcon className="size-3" /> reusable · {link.use_count} used
          </span>
        )}
        {link.expires_at && (
          <span>· expires {new Date(link.expires_at).toLocaleDateString()}</span>
        )}
      </div>

      {isDead ? (
        <span className="relative z-10 inline-block px-3 py-1.5 rounded-full bg-[var(--color-line)] text-[var(--color-bone-dim)] text-xs font-mono">
          {isExpired ? 'expired' : 'used up'}
        </span>
      ) : (
        <motion.button
          onClick={onCopy}
          whileTap={{ scale: 0.96 }}
          className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-line)] text-[var(--color-bone)] text-xs font-mono transition-colors hover:bg-[var(--color-surface-raised)] w-full justify-center"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 text-[var(--color-emerald-bright)]"
              >
                <Check className="size-3.5" /> Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2"
              >
                <Copy className="size-3.5" /> Copy link
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </motion.div>
  )
}

function CreateLinkForm({
  accessToken,
  onCreated,
}: {
  accessToken: string | null
  onCreated: () => void
}) {
  const [hasFixedAmount, setHasFixedAmount] = useState(true)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [singleUse, setSingleUse] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiCreateLink(accessToken, {
        amount: hasFixedAmount && amount ? parseFloat(amount) : undefined,
        currency,
        description: description || undefined,
        is_single_use: singleUse,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10 pb-10 border-b border-[var(--color-line)]">
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setHasFixedAmount(true)}
          className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide transition-colors ${
            hasFixedAmount ? 'bg-[var(--color-emerald-bright)] text-[var(--color-void)]' : 'border border-[var(--color-line)] text-[var(--color-bone-dim)]'
          }`}
        >
          Fixed amount
        </button>
        <button
          type="button"
          onClick={() => setHasFixedAmount(false)}
          className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide transition-colors ${
            !hasFixedAmount ? 'bg-[var(--color-emerald-bright)] text-[var(--color-void)]' : 'border border-[var(--color-line)] text-[var(--color-bone-dim)]'
          }`}
        >
          Any amount
        </button>
      </div>

      {hasFixedAmount && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ overflow: 'hidden' }}
          className="flex items-baseline gap-2 mb-6"
        >
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
            className="bg-transparent border-none outline-none font-bold text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/40 flex-1 min-w-0"
            style={{ fontFamily: 'var(--font-display)', fontSize: '40px' }}
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-full px-3 py-1 font-mono text-xs text-[var(--color-bone)] cursor-pointer outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c} className="bg-[var(--color-surface)]">{c}</option>
            ))}
          </select>
        </motion.div>
      )}

      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-transparent border-b border-[var(--color-line)] pb-3 mb-6 text-lg text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
      />

      <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
        <button
          type="button"
          onClick={() => setSingleUse((v) => !v)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
            singleUse ? 'bg-[var(--color-emerald-bright)]' : 'bg-[var(--color-surface-raised)]'
          }`}
        >
          <motion.div
            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
            animate={{ x: singleUse ? 16 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        </button>
        <span className="text-sm text-[var(--color-bone-dim)]">Single use only</span>
      </label>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
          {error}
        </div>
      )}

      <motion.button
        type="submit"
        disabled={submitting}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="px-7 py-3 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create link'}
      </motion.button>
    </form>
  )
}