import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, CheckCircle2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { splitsApi } from '@/api/splits'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, formatRelativeTime, CURRENCIES, CURRENCY_FLAGS } from '@/lib/utils'

const memberSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive().optional(),
  percentage: z.number().positive().max(100).optional(),
})

const createSchema = z.object({
  title: z.string().min(2).max(255),
  total_amount: z.number().positive(),
  currency: z.enum(CURRENCIES),
  split_type: z.enum(['equal', 'custom', 'percentage']),
  members: z.array(memberSchema).min(2),
})
type CreateForm = z.infer<typeof createSchema>

export function SplitsPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState<number | null>(null)
  const [settleOpen, setSettleOpen] = useState<number | null>(null)
  const [settleCurrency, setSettleCurrency] = useState('USD')

  const { data, isLoading } = useQuery({
    queryKey: ['splits'],
    queryFn: () => splitsApi.getAll({ limit: 20 }).then((r) => r.data),
  })

  const { data: splitDetail } = useQuery({
    queryKey: ['split', detailOpen],
    queryFn: () => splitsApi.getOne(detailOpen!).then((r) => r.data.split),
    enabled: detailOpen !== null,
  })

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      currency: 'USD',
      split_type: 'equal',
      members: [{ email: '' }, { email: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'members' })
  const splitType = watch('split_type')

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => splitsApi.create(d),
    onSuccess: () => {
      toast.success('Split created!')
      setOpen(false)
      reset()
      qc.invalidateQueries({ queryKey: ['splits'] })
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed')
    },
  })

  const settleMutation = useMutation({
    mutationFn: ({ id, currency }: { id: number; currency: string }) =>
      splitsApi.settle(id, { currency }),
    onSuccess: () => {
      toast.success('Your share is settled!')
      setSettleOpen(null)
      qc.invalidateQueries({ queryKey: ['splits'] })
      qc.invalidateQueries({ queryKey: ['split', detailOpen] })
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed')
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bill Splits</h1>
          <p className="text-gray-500 text-sm mt-1">Split expenses with friends and settle up</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />New Split</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Bill Split</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <Input label="Title" placeholder="Dinner at XYZ..." error={errors.title?.message} {...register('title')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total Amount" type="number" step="0.01" placeholder="0.00" error={errors.total_amount?.message} {...register('total_amount', { valueAsNumber: true })} />
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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">Split Type</label>
                <Select value={watch('split_type')} onValueChange={(v) => setValue('split_type', v as 'equal' | 'custom' | 'percentage')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal</SelectItem>
                    <SelectItem value="custom">Custom amounts</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Members</label>
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <Input placeholder="Email" type="email" {...register(`members.${idx}.email`)} />
                    {splitType === 'custom' && (
                      <Input placeholder="Amount" type="number" step="0.01" className="w-28" {...register(`members.${idx}.amount`, { valueAsNumber: true })} />
                    )}
                    {splitType === 'percentage' && (
                      <Input placeholder="%" type="number" className="w-20" {...register(`members.${idx}.percentage`, { valueAsNumber: true })} />
                    )}
                    {fields.length > 2 && (
                      <Button size="icon" variant="ghost" type="button" className="shrink-0 hover:text-red-400" onClick={() => remove(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ email: '' })}>
                  <Plus className="h-3 w-3" /> Add Member
                </Button>
              </div>

              <Button type="submit" className="w-full" loading={createMutation.isPending}>Create Split</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#18181f] border border-[#2a2a35] animate-pulse" />)
        ) : data?.data.length ? (
          data.data.map((split) => {
            const myMember = split.members?.find((m) => m.user_id === user?.id)
            const settled = split.members?.filter((m) => m.is_settled).length ?? 0
            const total = split.members?.length ?? 0
            return (
              <div key={split.id} className="rounded-xl border border-[#2a2a35] bg-[#18181f] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-600/15 flex items-center justify-center">
                      <Users className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-100">{split.title}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(split.created_at)} · {total} members · {settled}/{total} settled</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(parseFloat(split.total_amount), split.currency)}
                    </p>
                    <Badge variant={split.status === 'completed' ? 'success' : 'warning'}>
                      {split.status}
                    </Badge>
                  </div>
                </div>

                {myMember && (
                  <div className="mt-3 pt-3 border-t border-[#2a2a35] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Your share</p>
                      <p className="text-sm font-semibold text-gray-200">
                        {formatCurrency(parseFloat(myMember.amount), split.currency)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDetailOpen(split.id)}>View</Button>
                      {!myMember.is_settled && (
                        <Button size="sm" onClick={() => { setSettleOpen(split.id); setSettleCurrency(split.currency) }}>
                          <CheckCircle2 className="h-4 w-4" /> Settle
                        </Button>
                      )}
                      {myMember.is_settled && (
                        <Badge variant="success">Settled</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No splits yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Split detail dialog */}
      <Dialog open={detailOpen !== null} onOpenChange={(o) => !o && setDetailOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{splitDetail?.title}</DialogTitle></DialogHeader>
          {splitDetail && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-[#1f1f28] p-4">
                <span className="text-sm text-gray-500">Total</span>
                <span className="font-bold text-white">{formatCurrency(parseFloat(splitDetail.total_amount), splitDetail.currency)}</span>
              </div>
              <div className="divide-y divide-[#2a2a35]">
                {splitDetail.members?.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{m.name || m.email}</p>
                      <p className="text-xs text-gray-600">{m.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-100">
                        {formatCurrency(parseFloat(m.amount), splitDetail.currency)}
                      </p>
                      <Badge variant={m.is_settled ? 'success' : 'warning'}>
                        {m.is_settled ? 'Settled' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settle dialog */}
      <Dialog open={settleOpen !== null} onOpenChange={(o) => !o && setSettleOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Settle Your Share</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Pay from wallet</label>
              <Select value={settleCurrency} onValueChange={setSettleCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              loading={settleMutation.isPending}
              onClick={() => settleOpen !== null && settleMutation.mutate({ id: settleOpen, currency: settleCurrency })}
            >
              Confirm Settlement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
