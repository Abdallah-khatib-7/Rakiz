import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, ArrowDownLeft, Link2, TrendingUp, Wallet } from 'lucide-react'
import { walletsApi } from '@/api/wallets'
import { requestsApi } from '@/api/requests'
import { linksApi } from '@/api/links'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatRelativeTime, CURRENCY_FLAGS } from '@/lib/utils'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll().then((r) => r.data.wallets),
  })

  const { data: txData } = useQuery({
    queryKey: ['transactions', 'dashboard'],
    queryFn: () => walletsApi.getTransactions({ limit: 5 }).then((r) => r.data),
  })

  const { data: requestsData } = useQuery({
    queryKey: ['requests', 'pending'],
    queryFn: () => requestsApi.getAll({ type: 'received', limit: 3 }).then((r) => r.data),
  })

  const { data: linksData } = useQuery({
    queryKey: ['links', 'dashboard'],
    queryFn: () => linksApi.getAll({ limit: 3 }).then((r) => r.data),
  })

  const totalUSD = walletsData?.find((w) => w.currency === 'USD')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your account</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="USD Balance"
          value={totalUSD ? formatCurrency(parseFloat(totalUSD.balance), 'USD') : '—'}
          icon={<Wallet className="h-5 w-5 text-indigo-400" />}
          sub={`${walletsData?.length ?? 0} wallets total`}
        />
        <StatCard
          label="Active Links"
          value={String(linksData?.pagination.total ?? '—')}
          icon={<Link2 className="h-5 w-5 text-violet-400" />}
          sub="Payment links"
        />
        <StatCard
          label="Pending Requests"
          value={String(requestsData?.pagination.total ?? '—')}
          icon={<ArrowDownLeft className="h-5 w-5 text-amber-400" />}
          sub="Awaiting payment"
        />
        <StatCard
          label="Transactions"
          value={String(txData?.pagination.total ?? '—')}
          icon={<TrendingUp className="h-5 w-5 text-green-400" />}
          sub="All time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            {walletsData?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {walletsData.map((w) => (
                  <div
                    key={w.currency}
                    className="rounded-xl bg-[#1f1f28] border border-[#2a2a35] p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{CURRENCY_FLAGS[w.currency as keyof typeof CURRENCY_FLAGS]}</span>
                      <span className="text-xs font-medium text-gray-500">{w.currency}</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(parseFloat(w.balance), w.currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No wallets found.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsData?.data.length ? (
              <div className="space-y-3">
                {requestsData.data.map((req) => (
                  <div key={req.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{req.requester_name}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(req.created_at)}</p>
                    </div>
                    <Badge variant="warning">
                      {formatCurrency(parseFloat(req.amount), req.currency)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No pending requests.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txData?.data.length ? (
            <div className="divide-y divide-[#2a2a35]">
              {txData.data.map((tx) => {
                const isSend = tx.type === 'send'
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isSend ? 'bg-red-600/15' : 'bg-green-600/15'}`}>
                        {isSend
                          ? <ArrowUpRight className="h-4 w-4 text-red-400" />
                          : <ArrowDownLeft className="h-4 w-4 text-green-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {isSend ? `To ${tx.receiver_name ?? '—'}` : `From ${tx.sender_name ?? '—'}`}
                        </p>
                        <p className="text-xs text-gray-500">{formatRelativeTime(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isSend ? 'text-red-400' : 'text-green-400'}`}>
                        {isSend ? '-' : '+'}{formatCurrency(parseFloat(tx.amount), tx.currency)}
                      </p>
                      <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'destructive' : 'warning'} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-sm py-4 text-center">No transactions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="h-9 w-9 rounded-xl bg-[#1f1f28] border border-[#2a2a35] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </Card>
  )
}
