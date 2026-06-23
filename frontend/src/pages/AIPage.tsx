import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Search, TrendingUp, AlertTriangle, Lightbulb, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiGenerateInsight, apiGetInsight, apiDetectAnomalies, apiSearchTransactions } from '@/lib/api'

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', LBP: 'ل.ل', SAR: '﷼', AED: 'د.إ', GBP: '£',
}

const currentMonth = () => new Date().toISOString().slice(0, 7)

type Insight = {
  month: string
  total_sent: number
  total_received: number
  top_categories: string[]
  savings_suggestions: string[]
  summary_text: string
  anomalies_detected?: { description: string; reasoning: string }[]
}

type SearchResult = {
  id: number
  amount: string
  currency: string
  note: string | null
  created_at: string
  sender_name: string
  receiver_name: string
  direction: 'sent' | 'received'
}

export default function AIPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const month = currentMonth()

  const [insight, setInsight] = useState<Insight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [detectingAnomalies, setDetectingAnomalies] = useState(false)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)

  useEffect(() => {
    apiGetInsight(accessToken, month)
      .then((res) => setInsight(res.insight))
      .catch(() => setInsight(null))
      .finally(() => setLoadingInsight(false))
  }, [accessToken, month])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await apiGenerateInsight(accessToken, month)
      setInsight(res.insight)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate insight')
    } finally {
      setGenerating(false)
    }
  }

  const handleDetectAnomalies = async () => {
    setDetectingAnomalies(true)
    try {
      const res = await apiDetectAnomalies(accessToken, month)
      setInsight((prev) => (prev ? { ...prev, anomalies_detected: res.anomalies } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check for anomalies')
    } finally {
      setDetectingAnomalies(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults(null)
    try {
      const res = await apiSearchTransactions(accessToken, query)
      setResults(res.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-4xl">
      <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-4">
        AI Insights
      </p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-bold text-[var(--color-bone)] mb-10"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)' }}
      >
        Ask anything about your money.
      </motion.h1>

      <form onSubmit={handleSearch} className="relative mb-3">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-5 text-[var(--color-bone-dim)]" />
        <input
          type="text"
          placeholder="Find my transactions with Sara last month..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent border-b border-[var(--color-line)] pl-8 pb-4 text-lg sm:text-xl text-[var(--color-bone)] placeholder-[var(--color-bone-dim)]/50 outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
        />
        <motion.button
          type="submit"
          disabled={searching || !query.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 -translate-y-2 px-4 py-2 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-xs font-semibold disabled:opacity-40"
        >
          {searching ? '...' : 'Search'}
        </motion.button>
      </form>

      <AnimatePresence>
        {results !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
            className="mb-12"
          >
            {results.length === 0 ? (
              <p className="text-[var(--color-bone-dim)] text-sm py-6">No matching transactions found.</p>
            ) : (
              <div className="pt-4">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center justify-between py-4 ${i > 0 ? 'border-t border-[var(--color-line)]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {r.direction === 'received' ? (
                        <ArrowDownLeft className="size-4 text-[var(--color-emerald-bright)]" />
                      ) : (
                        <ArrowUpRight className="size-4 text-[var(--color-bone-dim)]" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-[var(--color-bone)]">
                          {r.direction === 'received' ? r.sender_name : r.receiver_name}
                        </div>
                        <div className="text-xs text-[var(--color-bone-dim)] font-mono">
                          {r.note || '—'} · {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-[var(--color-bone)]">
                      {CURRENCY_SYMBOLS[r.currency]}{Number(r.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-3 mb-8 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
          {error}
        </div>
      )}

      <div className="pt-4 border-t border-[var(--color-line)]">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
            This month
          </h2>
          {insight && (
            <motion.button
              onClick={handleDetectAnomalies}
              disabled={detectingAnomalies}
              whileHover={{ scale: 1.03 }}
              className="text-xs font-mono text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] flex items-center gap-1.5"
            >
              <AlertTriangle className="size-3" />
              {detectingAnomalies ? 'Checking...' : 'Check for anomalies'}
            </motion.button>
          )}
        </div>

        {loadingInsight ? (
          <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
        ) : !insight ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center rounded-2xl border border-dashed border-[var(--color-line)]"
          >
            <Sparkles className="size-7 text-[var(--color-bullion)] mx-auto mb-4" />
            <p className="text-[var(--color-bone-dim)] text-sm mb-6">
              No insight generated for this month yet.
            </p>
            <motion.button
              onClick={handleGenerate}
              disabled={generating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold disabled:opacity-50"
            >
              {generating ? 'Thinking...' : 'Generate insight'}
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[var(--color-bone)] text-base leading-relaxed"
            >
              {insight.summary_text}
            </motion.p>

            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-2 text-[var(--color-bone-dim)] text-xs font-mono uppercase tracking-wide mb-3">
                  <TrendingUp className="size-3.5" />
                  Sent vs received
                </div>
                <div className="flex items-baseline gap-4">
                  <div>
                    <div className="font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>
                      ${insight.total_sent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-[var(--color-bone-dim)]">sent</div>
                  </div>
                  <div>
                    <div className="font-bold text-[var(--color-emerald-bright)]" style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>
                      ${insight.total_received.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-[var(--color-bone-dim)]">received</div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="text-[var(--color-bone-dim)] text-xs font-mono uppercase tracking-wide mb-3">
                  Top categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {insight.top_categories.map((cat, i) => (
                    <motion.span
                      key={cat}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-bone)] text-xs font-mono"
                    >
                      {cat}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>

            {insight.savings_suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="flex items-center gap-2 text-[var(--color-bone-dim)] text-xs font-mono uppercase tracking-wide mb-3">
                  <Lightbulb className="size-3.5" />
                  Savings suggestions
                </div>
                <ul className="space-y-2">
                  {insight.savings_suggestions.map((s, i) => (
                    <motion.li
                      key={s}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="text-sm text-[var(--color-bone-dim)] flex items-start gap-2"
                    >
                      <span className="text-[var(--color-bullion)] mt-1">·</span>
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {insight.anomalies_detected && insight.anomalies_detected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-[var(--color-bullion)]/40 bg-[var(--color-bullion)]/5"
              >
                <div className="flex items-center gap-2 text-[var(--color-bullion)] text-xs font-mono uppercase tracking-wide mb-3">
                  <AlertTriangle className="size-3.5" />
                  Flagged for your attention
                </div>
                <ul className="space-y-3">
                  {insight.anomalies_detected.map((a) => (
                    <li key={a.description} className="text-sm">
                      <p className="text-[var(--color-bone)] font-medium mb-0.5">{a.description}</p>
                      <p className="text-[var(--color-bone-dim)] text-xs">{a.reasoning}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}