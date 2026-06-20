import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { walletsApi } from '@/api/wallets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, formatRelativeTime, CURRENCIES, CURRENCY_FLAGS } from '@/lib/utils'

const sendSchema = z.object({
  receiver_email: z.string().email('Invalid email'),
  amount: z.number().positive('Must be positive'),
  currency: z.enum(CURRENCIES),
  target_currency: z.enum(CURRENCIES).optional(),
  note: z.string().max(512).optional(),
})
type SendForm = z.infer<typeof sendSchema>

export function WalletPage() {
  const qc = useQueryClient()
  const [sendOpen, setSendOpen] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [txCurrency, setTxCurrency] = useState<string>('all')

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletsApi.getAll().then((r) => r.data.wallets),
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', txPage, txCurrency],
    queryFn: () =>
      walletsApi.getTransactions({
        page: txPage,
        limit: 10,
        currency: txCurrency === 'all' ? undefined : txCurrency,
      }).then((r) => r.data),
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SendForm>({
    resolver: zodResolver(sendSchema),
    defaultValues: { currency: 'USD' },
  })

  const sendMutation = useMutation({
    mutationFn: (data: SendForm) =>
      walletsApi.send({
        ...data,
        target_currency: data.target_currency || undefined,
      }),
    onSuccess: () => {
      toast.success('Money sent successfully!')
      setSendOpen(false)
      reset()
      qc.invalidateQueries({ queryKey: ['wallets'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Send failed'
      toast.error(msg)
    },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your multi-currency balances</p>
        </div>
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4" />
              Send Money
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Money</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => sendMutation.mutate(d))} className="space-y-4">
              <Input
                label="Recipient Email"
                type="email"
                placeholder="friend@example.com"
                error={errors.receiver_email?.message}
                {...register('receiver_email')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={errors.amount?.message}
                  {...register('amount', { valueAsNumber: true })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Currency</label>
                  <Select
                    value={watch('currency')}
                    onValueChange={(v) => setValue('currency', v as typeof CURRENCIES[number])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CURRENCY_FLAGS[c]} {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">Convert to (optional)</label>
                <Select
                  value={watch('target_currency') ?? ''}
                  onValueChange={(v) => setValue('target_currency', v ? v as typeof CURRENCIES[number] : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Same currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Same currency</SelectItem>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CURRENCY_FLAGS[c]} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Note (optional)"
                placeholder="Lunch, rent, etc."
                {...register('note')}
              />
              <Button type="submit" className="w-full" loading={sendMutation.isPending}>
                Send
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallets grid */}
      {walletsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#18181f] border border-[#2a2a35] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {wallets?.map((w) => (
            <div
              key={w.currency}
              className="rounded-xl border border-[#2a2a35] bg-gradient-to-br from-[#1f1f28] to-[#18181f] p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{CURRENCY_FLAGS[w.currency as keyof typeof CURRENCY_FLAGS]}</span>
                <span className="text-sm font-medium text-gray-400">{w.currency}</span>
              </div>
              <p className="text-xl font-bold text-white">
                {formatCurrency(parseFloat(w.balance), w.currency)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Updated {formatRelativeTime(w.updated_at)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={txCurrency} onValueChange={(v) => { setTxCurrency(v); setTxPage(1) }}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setTxPage(1)
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-[#1f1f28] animate-pulse" />
              ))}
            </div>
          ) : txData?.data.length ? (
            <>
              <div className="divide-y divide-[#2a2a35]">
                {txData.data.map((tx) => {
                  const isSend = tx.type === 'send'
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isSend ? 'bg-red-600/15' : 'bg-green-600/15'}`}>
                          {isSend
                            ? <ArrowUpRight className="h-4 w-4 text-red-400" />
                            : <ArrowDownLeft className="h-4 w-4 text-green-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">
                            {isSend ? `To ${tx.receiver_name ?? '—'}` : `From ${tx.sender_name ?? '—'}`}
                          </p>
                          {tx.note && <p className="text-xs text-gray-600">{tx.note}</p>}
                          <p className="text-xs text-gray-600">{formatRelativeTime(tx.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${isSend ? 'text-red-400' : 'text-green-400'}`}>
                          {isSend ? '-' : '+'}{formatCurrency(parseFloat(tx.amount), tx.currency)}
                        </p>
                        <Badge
                          variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'destructive' : 'warning'}
                          className="mt-0.5"
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Pagination */}
              {txData.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a35]">
                  <p className="text-xs text-gray-500">
                    Page {txData.pagination.page} of {txData.pagination.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>
                      Previous
                    </Button>
                    <Button size="sm" variant="outline" disabled={txPage >= txData.pagination.total_pages} onClick={() => setTxPage(p => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-600 text-sm py-8 text-center">No transactions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
