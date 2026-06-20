import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Users, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  })
}

function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => api.get('/admin/users', { params: { page, limit: 20 } }).then((r) => r.data),
  })
}

function useAdminFraud() {
  return useQuery({
    queryKey: ['admin-fraud'],
    queryFn: () => api.get('/admin/fraud').then((r) => r.data),
  })
}

export function AdminPage() {
  const qc = useQueryClient()
  const { data: stats } = useAdminStats()
  const { data: usersData } = useAdminUsers(1)
  const { data: fraudData } = useAdminFraud()

  const [adjustOpen, setAdjustOpen] = useState<number | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustCurrency, setAdjustCurrency] = useState('USD')
  const [adjustNote, setAdjustNote] = useState('')

  const adjustMutation = useMutation({
    mutationFn: ({ userId, amount, currency, note }: { userId: number; amount: number; currency: string; note: string }) =>
      api.post(`/admin/users/${userId}/balance`, { amount, currency, note }),
    onSuccess: () => {
      toast.success('Balance adjusted')
      setAdjustOpen(null)
      setAdjustAmount('')
      setAdjustNote('')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed')
    },
  })

  const resolveFraudMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/fraud/${id}/resolve`),
    onSuccess: () => { toast.success('Resolved'); qc.invalidateQueries({ queryKey: ['admin-fraud'] }) },
    onError: () => toast.error('Failed'),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-600/15 flex items-center justify-center">
          <Shield className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Platform management</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: String(stats.total_users ?? '—'), icon: <Users className="h-5 w-5 text-blue-400" /> },
            { label: 'Revenue (USD)', value: stats.revenue_usd ? formatCurrency(parseFloat(stats.revenue_usd), 'USD') : '—', icon: <DollarSign className="h-5 w-5 text-green-400" /> },
            { label: 'Active Today', value: String(stats.active_today ?? '—'), icon: <RefreshCw className="h-5 w-5 text-indigo-400" /> },
            { label: 'Fraud Flags', value: String(stats.fraud_flags ?? '—'), icon: <AlertTriangle className="h-5 w-5 text-amber-400" /> },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{s.label}</span>
                {s.icon}
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="fraud"><AlertTriangle className="h-4 w-4 mr-1.5" />Fraud Review</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
            <CardContent>
              {usersData?.data?.length ? (
                <div className="divide-y divide-[#2a2a35]">
                  {usersData.data.map((u: { id: number; full_name: string; email: string; subscription_tier: string; is_verified: boolean; created_at: string }) => (
                    <div key={u.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-200">{u.full_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-600">{formatRelativeTime(u.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant={u.subscription_tier === 'premium' ? 'default' : u.subscription_tier === 'pro' ? 'secondary' : 'secondary'}>
                            {u.subscription_tier}
                          </Badge>
                          <div className="mt-1">
                            <Badge variant={u.is_verified ? 'success' : 'warning'}>
                              {u.is_verified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setAdjustOpen(u.id)}>
                          Adjust Balance
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No users found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud">
          <Card>
            <CardHeader><CardTitle>Fraud Review Queue</CardTitle></CardHeader>
            <CardContent>
              {fraudData?.data?.length ? (
                <div className="space-y-3">
                  {fraudData.data.map((f: { id: number; user_name: string; reason: string; amount: string; currency: string; created_at: string }) => (
                    <div key={f.id} className="rounded-xl border border-amber-600/20 bg-amber-600/5 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-200">{f.user_name}</p>
                          <p className="text-xs text-gray-400 mt-1">{f.reason}</p>
                          <p className="text-xs text-gray-600 mt-1">{formatRelativeTime(f.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="warning">{formatCurrency(parseFloat(f.amount), f.currency)}</Badge>
                          <Button size="sm" variant="outline" onClick={() => resolveFraudMutation.mutate(f.id)}>
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <AlertTriangle className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No fraud cases in review.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Balance adjust dialog */}
      <Dialog open={adjustOpen !== null} onOpenChange={(o) => !o && setAdjustOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust User Balance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Use negative values to deduct. This creates a manual ledger entry.</p>
            <Input
              label="Amount (positive = add, negative = deduct)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
            />
            <Input
              label="Currency"
              placeholder="USD"
              value={adjustCurrency}
              onChange={(e) => setAdjustCurrency(e.target.value.toUpperCase())}
            />
            <Input
              label="Note"
              placeholder="Reason for adjustment..."
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
            />
            <Button
              className="w-full"
              loading={adjustMutation.isPending}
              onClick={() => {
                if (adjustOpen !== null) {
                  adjustMutation.mutate({
                    userId: adjustOpen,
                    amount: parseFloat(adjustAmount),
                    currency: adjustCurrency,
                    note: adjustNote,
                  })
                }
              }}
            >
              Apply Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
