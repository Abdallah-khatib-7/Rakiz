import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiGetUsage, apiCreateCheckout, apiCreatePortalSession } from '@/lib/api'

const TIER_DETAILS = {
  free: { name: 'Free', price: '$0' },
  pro: { name: 'Pro', price: '$9.99' },
  business: { name: 'Business', price: '$29.99' },
}

type Usage = {
  tier: string
  sends: { used: number; limit: number | null }
  splits: { used: number; limit: number | null }
}

export default function BillingPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGetUsage(accessToken)
      .then(setUsage)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [accessToken])

  const handleUpgrade = async (tier: 'pro' | 'business') => {
    setActionLoading(tier)
    setError('')
    try {
      const { url } = await apiCreateCheckout(accessToken, tier)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setActionLoading(null)
    }
  }

  const handleManage = async () => {
    setActionLoading('portal')
    setError('')
    try {
      const { url } = await apiCreatePortalSession(accessToken)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal')
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-3xl">
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      </div>
    )
  }

  const tier = usage?.tier || 'free'
  const tierInfo = TIER_DETAILS[tier as keyof typeof TIER_DETAILS]
  const isFree = tier === 'free'

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-3xl">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-4"
      >
        Billing
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-2"
      >
        <div className="flex items-baseline gap-3">
          <span
            className="font-bold text-[var(--color-bone)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 64px)' }}
          >
            {tierInfo.name}
          </span>
          <span className="font-mono text-sm text-[var(--color-bone-dim)]">{tierInfo.price}/month</span>
        </div>
        {!isFree && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -top-1 -right-8 sm:right-auto sm:-top-2 sm:left-full sm:ml-3"
          >
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-emerald)]/15 text-[var(--color-emerald-bright)] text-xs font-mono">
              <Sparkles className="size-3" />
              active
            </span>
          </motion.div>
        )}
      </motion.div>
      <p className="text-[var(--color-bone-dim)] text-sm mb-10">Your current plan</p>

      {error && (
        <div className="p-3 mb-6 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg max-w-md">
          {error}
        </div>
      )}

      {usage && (
        <div className="space-y-7 mb-12 pb-10 border-b border-[var(--color-line)]">
          <UsageBar label="Sends this month" used={usage.sends.used} limit={usage.sends.limit} delay={0.2} />
          <UsageBar label="Splits this month" used={usage.splits.used} limit={usage.splits.limit} delay={0.35} />
        </div>
      )}

      {isFree ? (
        <div className="grid sm:grid-cols-2 gap-6 max-w-xl">
          <PlanOption
            name="Pro"
            price="$9.99/mo"
            features={['Unlimited sends & splits', 'Full AI insights', 'Natural language search']}
            onSelect={() => handleUpgrade('pro')}
            loading={actionLoading === 'pro'}
            delay={0.4}
            highlight
          />
          <PlanOption
            name="Business"
            price="$29.99/mo"
            features={['Everything in Pro', 'Team members', 'Webhooks & analytics']}
            onSelect={() => handleUpgrade('business')}
            loading={actionLoading === 'business'}
            delay={0.5}
          />
        </div>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleManage}
          disabled={actionLoading === 'portal'}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="px-7 py-3 rounded-full border border-[var(--color-line)] text-[var(--color-bone)] text-sm font-semibold transition-colors hover:bg-[var(--color-surface)] disabled:opacity-50"
        >
          {actionLoading === 'portal' ? 'Opening...' : 'Manage subscription'}
        </motion.button>
      )}
    </div>
  )
}

function UsageBar({
  label,
  used,
  limit,
  delay,
}: {
  label: string
  used: number
  limit: number | null
  delay: number
}) {
  const pct = limit === null ? 0 : Math.min(100, (used / limit) * 100)
  const isUnlimited = limit === null
  const isNearLimit = !isUnlimited && pct >= 80

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm text-[var(--color-bone)]">{label}</span>
        <motion.span
          className="font-mono text-xs"
          animate={{ color: isNearLimit ? '#f87171' : 'var(--color-bone-dim)' }}
        >
          {isUnlimited ? `${used} sent · unlimited` : `${used} of ${limit}`}
        </motion.span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: delay + 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full ${pct >= 100 ? 'bg-red-400' : 'bg-[var(--color-emerald-bright)]'}`}
          />
        </div>
      )}
    </motion.div>
  )
}

function PlanOption({
  name,
  price,
  features,
  onSelect,
  loading,
  delay,
  highlight,
}: {
  name: string
  price: string
  features: string[]
  onSelect: () => void
  loading: boolean
  delay: number
  highlight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className={`rounded-2xl border p-6 transition-shadow ${
        highlight
          ? 'border-[var(--color-emerald-bright)] bg-[var(--color-surface)] hover:shadow-[0_0_30px_rgba(0,210,122,0.15)]'
          : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:shadow-[0_0_30px_rgba(236,230,216,0.06)]'
      }`}
    >
      <h3 className="text-lg font-semibold text-[var(--color-bone)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {name}
      </h3>
      <p className="font-mono text-sm text-[var(--color-bone-dim)] mb-4">{price}</p>
      <ul className="space-y-2 mb-6">
        {features.map((f, i) => (
          <motion.li
            key={f}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 + i * 0.05 }}
            className="flex items-start gap-2 text-sm text-[var(--color-bone-dim)]"
          >
            <Check className="size-4 text-[var(--color-emerald-bright)] flex-shrink-0 mt-0.5" />
            {f}
          </motion.li>
        ))}
      </ul>
      <motion.button
        onClick={onSelect}
        disabled={loading}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
          highlight
            ? 'bg-[var(--color-emerald-bright)] text-[var(--color-void)]'
            : 'border border-[var(--color-line)] text-[var(--color-bone)] hover:bg-[var(--color-surface-raised)]'
        }`}
      >
        {loading ? 'Redirecting...' : `Upgrade to ${name}`}
      </motion.button>
    </motion.div>
  )
}