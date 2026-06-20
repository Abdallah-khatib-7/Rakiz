import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Copy, Trash2, Link2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { linksApi } from '@/api/links'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatCurrency, formatDate, CURRENCIES, CURRENCY_FLAGS } from '@/lib/utils'

const createSchema = z.object({
  currency: z.enum(CURRENCIES),
  amount: z.number().positive().optional(),
  description: z.string().max(512).optional(),
  is_single_use: z.boolean().optional(),
  expires_in_hours: z.number().int().min(1).max(8760).optional(),
})
type CreateForm = z.infer<typeof createSchema>

export function LinksPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['links', page],
    queryFn: () => linksApi.getAll({ page, limit: 10 }).then((r) => r.data),
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { currency: 'USD', is_single_use: false },
  })

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => linksApi.create({ ...d, amount: d.amount || undefined, expires_in_hours: d.expires_in_hours || undefined }),
    onSuccess: () => {
      toast.success('Payment link created!')
      setOpen(false)
      reset()
      qc.invalidateQueries({ queryKey: ['links'] })
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create link')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => linksApi.delete(id),
    onSuccess: () => {
      toast.success('Link deleted')
      qc.invalidateQueries({ queryKey: ['links'] })
    },
    onError: () => toast.error('Failed to delete link'),
  })

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${token}`)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Links</h1>
          <p className="text-gray-500 text-sm mt-1">Create shareable links to receive money</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />New Link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Payment Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount (optional)"
                  type="number"
                  step="0.01"
                  placeholder="Any amount"
                  error={errors.amount?.message}
                  {...register('amount', { valueAsNumber: true })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Currency</label>
                  <Select value={watch('currency')} onValueChange={(v) => setValue('currency', v as typeof CURRENCIES[number])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input
                label="Description (optional)"
                placeholder="What's this payment for?"
                {...register('description')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Expires in (hours)"
                  type="number"
                  placeholder="Never"
                  {...register('expires_in_hours', { valueAsNumber: true })}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Single use?</label>
                  <div className="flex items-center gap-2 h-10">
                    <input type="checkbox" id="single_use" {...register('is_single_use')} className="accent-indigo-500 h-4 w-4" />
                    <label htmlFor="single_use" className="text-sm text-gray-400">One-time only</label>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" loading={createMutation.isPending}>
                Create Link
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Links</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-[#1f1f28] animate-pulse" />)}
            </div>
          ) : data?.data.length ? (
            <div className="space-y-3">
              {data.data.map((link) => (
                <div key={link.id} className="rounded-xl border border-[#2a2a35] bg-[#1f1f28] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600/15 flex items-center justify-center shrink-0">
                        <Link2 className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200">
                          {link.description || 'Payment Link'}
                        </p>
                        <p className="text-xs text-gray-600 font-mono truncate">
                          /pay/{link.token}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {link.amount && (
                            <Badge variant="secondary">
                              {formatCurrency(parseFloat(link.amount), link.currency)}
                            </Badge>
                          )}
                          <Badge variant={link.is_used ? 'secondary' : 'success'}>
                            {link.is_used ? 'Used' : 'Active'}
                          </Badge>
                          {link.is_single_use && <Badge variant="secondary">Single use</Badge>}
                          {link.expires_at && (
                            <span className="text-xs text-gray-600">Expires {formatDate(link.expires_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(`/pay/${link.token}`, '_blank')}
                        title="Open"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyLink(link.token)}
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:text-red-400"
                        onClick={() => deleteMutation.mutate(link.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {data.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">Page {data.pagination.page} of {data.pagination.total_pages}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={page >= data.pagination.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Link2 className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No payment links yet.</p>
              <p className="text-gray-600 text-xs mt-1">Create one to start receiving money.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
