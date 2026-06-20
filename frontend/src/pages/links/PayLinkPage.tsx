import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { linksApi } from '@/api/links'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, CURRENCIES, CURRENCY_FLAGS } from '@/lib/utils'

const schema = z.object({
  amount: z.number().positive().optional(),
  currency: z.enum(CURRENCIES),
})
type FormData = z.infer<typeof schema>

export function PayLinkPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [paid, setPaid] = useState(false)

  const { data: linkData, isLoading, error } = useQuery({
    queryKey: ['pay-link', token],
    queryFn: () => linksApi.getByToken(token!).then((r) => r.data.link),
    enabled: !!token,
    retry: false,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: linkData?.currency as typeof CURRENCIES[number] ?? 'USD' },
  })

  const payMutation = useMutation({
    mutationFn: (d: FormData) => linksApi.pay(token!, { ...d, amount: d.amount }),
    onSuccess: () => {
      setPaid(true)
      toast.success('Payment successful!')
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Payment failed')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Link not found</h2>
          <p className="text-gray-500 text-sm">This payment link is invalid, expired, or has already been used.</p>
        </div>
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Payment sent!</h2>
          <p className="text-gray-500 text-sm">Your payment has been processed successfully.</p>
          <Button className="mt-6" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Rakiz</span>
        </div>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a35]">
              <div className="h-12 w-12 rounded-xl bg-indigo-600/15 flex items-center justify-center">
                <Link2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment requested by</p>
                <p className="font-semibold text-white">{(linkData as { creator_name?: string }).creator_name ?? 'Unknown'}</p>
              </div>
            </div>

            {linkData.description && (
              <p className="text-sm text-gray-400 mb-4 rounded-lg bg-[#1f1f28] p-3">{linkData.description}</p>
            )}

            <form onSubmit={handleSubmit((d) => payMutation.mutate(d))} className="space-y-4">
              {linkData.amount ? (
                <div className="rounded-xl bg-[#1f1f28] border border-[#2a2a35] p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Amount to pay</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(parseFloat(linkData.amount), linkData.currency)}
                  </p>
                </div>
              ) : (
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={payMutation.isPending}>
                Pay Now
              </Button>
            </form>

            <p className="text-center text-xs text-gray-600 mt-4">
              Powered by <span className="text-indigo-400">Rakiz</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
