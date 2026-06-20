import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Crown, Zap, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { subscriptionsApi } from '@/api/subscriptions'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-gray-400',
    features: [
      'Basic wallet management',
      'Up to 5 payment links',
      'Money requests',
      'Bill splitting',
      'Standard support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'per month',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-indigo-400',
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited payment links',
      'Currency conversion',
      'AI spending insights',
      'Priority support',
      'Fraud detection',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29',
    period: 'per month',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-violet-400',
    features: [
      'Everything in Pro',
      'Advanced AI anomaly detection',
      'Natural language search',
      'Custom branding on links',
      'Dedicated support',
      'API access',
    ],
  },
]

export function SubscriptionsPage() {
  const user = useAuthStore((s) => s.user)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const checkoutMutation = useMutation({
    mutationFn: (plan: 'pro' | 'premium') => subscriptionsApi.createCheckout(plan),
    onSuccess: (res) => {
      window.location.href = res.data.url
    },
    onError: () => toast.error('Failed to start checkout'),
    onSettled: () => setLoadingPlan(null),
  })

  const portalMutation = useMutation({
    mutationFn: () => subscriptionsApi.createPortal(),
    onSuccess: (res) => {
      window.location.href = res.data.url
    },
    onError: () => toast.error('Failed to open billing portal'),
  })

  function handlePlan(planId: string) {
    if (planId === 'free') return
    setLoadingPlan(planId)
    checkoutMutation.mutate(planId as 'pro' | 'premium')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-gray-500 text-sm mt-2">Upgrade to unlock powerful features</p>
      </div>

      {user?.subscription_tier !== 'free' && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-indigo-600/20 bg-indigo-600/5 p-4">
          <Crown className="h-5 w-5 text-indigo-400" />
          <p className="text-sm text-gray-300">
            You're on the <strong className="text-indigo-300">{user?.subscription_tier?.toUpperCase()}</strong> plan.
          </p>
          <Button variant="outline" size="sm" onClick={() => portalMutation.mutate()} loading={portalMutation.isPending}>
            Manage Billing
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = user?.subscription_tier === plan.id
          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-indigo-600/50 ring-1 ring-indigo-600/30'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white border-0 shadow-lg shadow-indigo-500/25">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardContent className="flex flex-col flex-1 pt-2">
                <div className={cn('mb-4 flex items-center gap-2', plan.color)}>
                  {plan.icon}
                  <span className="font-semibold text-base">{plan.name}</span>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm ml-1">/{plan.period}</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="secondary" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Free Forever
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handlePlan(plan.id)}
                    loading={loadingPlan === plan.id}
                  >
                    Upgrade to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
