import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, Send, Users, ShieldAlert, Link2, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useSocket } from '@/context/SocketContext'
import { apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '@/lib/api'

const TYPE_ICONS: Record<string, typeof Send> = {
  transaction_received: Send,
  split_settled: Users,
  fraud_alert: ShieldAlert,
  link_paid: Link2,
  ai_insight: Sparkles,
}

type Notification = {
  id: number
  type: string
  title: string
  body: string | null
  is_read: boolean
  reference_id: number | null
  reference_type: string | null
  created_at: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const { setUnreadCount } = useSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = (unreadOnly: boolean) => {
    setLoading(true)
    apiGetNotifications(accessToken, 1, 30, unreadOnly)
      .then((res) => {
        setNotifications(res.notifications)
        setUnreadCount(res.unreadCount)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(filter === 'unread') 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, filter])

  const handleMarkRead = async (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await apiMarkNotificationRead(accessToken, id)
    } catch {
      // already optimistic, swallow
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await apiMarkAllNotificationsRead(accessToken)
  }

  const unreadInList = notifications.filter((n) => !n.is_read).length

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-14 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)]">
          Notifications
        </p>
        {unreadInList > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-[10px] font-bold"
          >
            {unreadInList}
          </motion.span>
        )}
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide transition-colors ${
                filter === f
                  ? 'bg-[var(--color-emerald-bright)] text-[var(--color-void)]'
                  : 'border border-[var(--color-line)] text-[var(--color-bone-dim)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {unreadInList > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-emerald-bright)] hover:underline"
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <span className="font-mono text-sm text-[var(--color-bone-dim)]">Loading...</span>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="size-7 text-[var(--color-bone-dim)] mx-auto mb-4" />
          <p className="text-[var(--color-bone-dim)] text-sm">
            {filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}
          </p>
        </div>
      ) : (
        <div>
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => {
              const Icon = TYPE_ICONS[n.type] || Bell
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-start gap-4 py-5 ${i > 0 ? 'border-t border-[var(--color-line)]' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 size-9 rounded-full flex items-center justify-center mt-0.5 ${
                      n.is_read
                        ? 'bg-[var(--color-surface)] text-[var(--color-bone-dim)]'
                        : 'bg-[var(--color-emerald)]/15 text-[var(--color-emerald-bright)]'
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3
                        className={`text-sm font-semibold ${n.is_read ? 'text-[var(--color-bone-dim)]' : 'text-[var(--color-bone)]'}`}
                      >
                        {n.title}
                      </h3>
                      <span className="font-mono text-xs text-[var(--color-bone-dim)] flex-shrink-0">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-sm text-[var(--color-bone-dim)] mt-1">{n.body}</p>
                    )}
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="flex-shrink-0 text-[var(--color-bone-dim)] hover:text-[var(--color-emerald-bright)] transition-colors mt-1"
                      aria-label="Mark as read"
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}