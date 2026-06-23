import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Briefcase, Database, Server } from 'lucide-react'
import NumberFlow from '@number-flow/react'
import { Card, CardHeader, CardContent } from './ui/card'

const PLANS = [
  {
    name: 'Free',
    description: 'Everything you need to get started moving money.',
    price: 0,
    yearlyPrice: 0,
    icon: <Briefcase size={18} />,
    features: ['20 sends per month', '5 splits per month', 'Basic AI insights', '3 months history'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    description: 'For anyone who sends and splits often.',
    price: 9.99,
    yearlyPrice: 95.9,
    icon: <Database size={18} />,
    features: ['Unlimited sends & splits', 'Full AI insights', 'Natural language search', 'Savings suggestions', '12 months history'],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    name: 'Business',
    description: 'For teams and businesses moving real volume.',
    price: 29.99,
    yearlyPrice: 287.9,
    icon: <Server size={18} />,
    features: ['Everything in Pro', 'Multiple wallets', 'Up to 5 team members', 'Webhooks', 'Full analytics export', 'Unlimited history'],
    cta: 'Go Business',
    highlight: false,
  },
]

function PricingSwitch({ onSwitch }: { onSwitch: (yearly: boolean) => void }) {
  const [selected, setSelected] = useState(false)

  const handleSwitch = (yearly: boolean) => {
    setSelected(yearly)
    onSwitch(yearly)
  }

  return (
    <div className="flex justify-center">
      <div className="relative flex w-fit rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] p-1">
        <button
          onClick={() => handleSwitch(false)}
          className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
            !selected ? 'text-[var(--color-void)]' : 'text-[var(--color-bone-dim)]'
          }`}
        >
          {!selected && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full bg-[var(--color-emerald-bright)]"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          onClick={() => handleSwitch(true)}
          className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
            selected ? 'text-[var(--color-void)]' : 'text-[var(--color-bone-dim)]'
          }`}
        >
          {selected && (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full bg-[var(--color-emerald-bright)]"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Yearly
            <span className="rounded-full bg-[var(--color-bullion)]/20 text-[var(--color-bullion)] px-2 py-0.5 text-xs font-medium">
              Save 20%
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default function PricingScene() {
  const [isYearly, setIsYearly] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  return (
    <section id="pricing" ref={sectionRef} className="relative bg-[var(--color-void)] py-32 sm:py-40 px-6 sm:px-10 md:px-16">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-[var(--color-bullion)] mb-4">
          Plans
        </p>
        <h2
          className="font-bold text-[var(--color-bone)] text-3xl sm:text-5xl md:text-6xl leading-[1.05] mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pay for more, not for less.
        </h2>
        <p className="text-[var(--color-bone-dim)] text-base">
          Every tier moves money instantly. The difference is how much room you need.
        </p>
      </div>

      <div className="mb-12">
        <PricingSwitch onSwitch={setIsYearly} />
      </div>

      <div className="grid md:grid-cols-3 max-w-5xl gap-6 mx-auto">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlight ? 'border-2 border-[var(--color-emerald-bright)] relative' : 'relative'}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-8 bg-[var(--color-emerald-bright)] text-[var(--color-void)] px-3 py-1 rounded-full text-xs font-semibold">
                Most popular
              </span>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 text-[var(--color-bone-dim)] mb-3">
                {plan.icon}
                <h3 className="text-xl font-semibold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {plan.name}
                </h3>
              </div>
              <p className="text-sm text-[var(--color-bone-dim)] mb-5">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
                  $
                  <NumberFlow value={isYearly ? plan.yearlyPrice : plan.price} />
                </span>
                <span className="font-mono text-sm text-[var(--color-bone-dim)]">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <a
                href="/register"
                className={`block w-full text-center py-3 rounded-full text-sm font-semibold mb-8 transition-transform hover:scale-105 ${
                  plan.highlight
                    ? 'bg-[var(--color-emerald-bright)] text-[var(--color-void)]'
                    : 'border border-[var(--color-line)] text-[var(--color-bone)]'
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--color-bone-dim)]">
                    <Check className="size-4 text-[var(--color-emerald-bright)] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}