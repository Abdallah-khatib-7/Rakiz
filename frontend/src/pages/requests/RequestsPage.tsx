import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { requestsApi } from '@/api/requests'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, formatRelativeTime, CURRENCIES, CURRENCY_FLAGS } from '@/lib/utils'

const createSchema = z.object({
  target_email: z.string().email('Invalid email'),
  amount: z.number().positive(),
  currency: z.enum(CURRENCIES),
  note: z.string().max(512).optional(),
  expires_in_hours: z.number().int().min(1).max(168).optional(),
})
type CreateForm = z.infer<typeof createSchema>

const statusVariant = (s: string) => {
  if (s === 'paid') return 'success'
  if (s === 'declined' || s === 'cancelled') return 'destructive'
  if (s === 'expired') return 'secondary'
  return 'warning'
}

export function RequestsPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const [payOpen, setPayOpen] = useState<number | null>(null)
  const [payCurrency, setPayCurrency] = useState<string>('USD')

  const { data, isLoading } = useQuery({
    queryKey: ['requests', tab],
    queryFn: () =>
      requestsApi.getAll({ type: tab as 'all' | 'sent' | 'received', limit: 20 }).then((r) => r.data),
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { currency: 'USD' },
  })

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => requestsApi.create({ ...d, expires_in_hours: d.expires_in_hours || undefined }),
    onSuccess: () => {
      toast.success('Request sent!')
      setOpen(false)
      reset()
      qc.invalidateQueries({ queryKey: ['requests'] })
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed')
    },
  })

  const payMutation = useMutation({
    mutationFn: ({ id, currency }: { id: number; currency: string }) =>
      requestsApi.pay(id, { currency }),
    onSuccess: () => {
      toast.success('Payment sent!')
      setPayOpen(null)
      qc.invalidateQueries({ queryKey: ['requests'] })
      qc.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed')
    },
  })

  const declineMutation = useMutation({
    mutationFn: (id: number) => requestsApi.decline(id),
    onSuccess: () => { toast.success('Declined'); qc.invalidateQueries({ queryKey: ['requests'] }) },
    onError: () => toast.error('Failed'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => requestsApi.cancel(id),
    onSuccess: () => { toast.success('Cancelled'); qc.invalidateQueries({ queryKey: ['requests'] }) },
    onError: () => toast.error('Failed'),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Money Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Request and pay money from contacts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Request Money</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <Input label="From (email)" type="email" placeholder="friend@example.com" error={errors.target_email?.message} {...register('target_email')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Amount" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount', { valueAsNumber: true })} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Currency</label>
                  <Select value={watch('currency')} onValueChange={(v) => setValue('currency', v as typeof CURRENCIES[number])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input label="Note (optional)" placeholder="What's it for?" {...register('note')} />
              <Input label="Expires in (hours, optional)" type="number" placeholder="168 = 7 days" {...register('expires_in_hours', { valueAsNumber: true })} />
              <Button type="submit" className="w-full" loading={createMutation.isPending}>Send Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <Card>
            <CardContent className="pt-2">
              {isLoading ? (
                <div className="space-y-3 pt-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-[#1f1f28] animate-pulse" />)}
                </div>
              ) : data?.data.length ? (
                <div className="divide-y divide-[#2a2a35]">
                  {data.data.map((req) => {
                    const isReceived = req.target_id === user?.id
                    const isMine = req.requester_id === user?.id
                    return (
                      <div key={req.id} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isReceived ? 'bg-amber-600/15' : 'bg-indigo-600/15'}`}>
                            {isReceived
                              ? <ArrowDownLeft className="h-5 w-5 text-amber-400" />
                              : <ArrowUpRight className="h-5 w-5 text-indigo-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {isReceived ? `From ${req.requester_name}` : `To ${req.target_name}`}
                            </p>
                            {req.note && <p className="text-xs text-gray-500">{req.note}</p>}
                            <p className="text-xs text-gray-600">{formatRelativeTime(req.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-100">
                              {formatCurrency(parseFloat(req.amount), req.currency)}
                            </p>
                            <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                          </div>
                          {req.status === 'pending' && isReceived && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" onClick={() => { setPayOpen(req.id); setPayCurrency(req.currency) }}>
                                Pay
                              </Button>
                              <Button size="icon" variant="ghost" className="hover:text-red-400" onClick={() => declineMutation.mutate(req.id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {req.status === 'pending' && isMine && !isReceived && (
                            <Button size="sm" variant="ghost" className="hover:text-red-400" onClick={() => cancelMutation.mutate(req.id)}>
                              <Ban className="h-4 w-4" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No requests found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pay dialog */}
      <Dialog open={payOpen !== null} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pay Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Pay from wallet</label>
              <Select value={payCurrency} onValueChange={setPayCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              loading={payMutation.isPending}
              onClick={() => payOpen !== null && payMutation.mutate({ id: payOpen, currency: payCurrency })}
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
