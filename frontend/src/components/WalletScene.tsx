import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

const CURRENCIES = [
  { code: 'USD', symbol: '$', amount: '4,280.00', region: 'United States' },
  { code: 'EUR', symbol: '€', amount: '1,950.40', region: 'European Union' },
  { code: 'AED', symbol: 'د.إ', amount: '2,640.15', region: 'United Arab Emirates' },
  { code: 'SAR', symbol: '﷼', amount: '3,120.90', region: 'Saudi Arabia' },
  { code: 'GBP', symbol: '£', amount: '980.25', region: 'United Kingdom' },
  { code: 'LBP', symbol: 'ل.ل', amount: '8,500,000', region: 'Lebanon' },
]

export default function WalletScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 })

  const trackX = useTransform(smoothProgress, [0, 1], ['6%', '-100%'])
  const headingY = useTransform(scrollYProgress, [0, 0.12], [0, -40])
  const headingOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.5])

  return (
    <section ref={containerRef} style={{ height: '420vh' }} className="relative bg-[var(--color-void)]">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <motion.div
          style={{ y: headingY, opacity: headingOpacity }}
          className="relative z-10 pt-16 sm:pt-20 px-6 sm:px-10 md:px-16 flex-shrink-0"
        >
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-3">
            One vault, six tongues
          </p>
          <h2
            className="font-bold text-[var(--color-bone)] text-2xl sm:text-4xl md:text-5xl max-w-2xl leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Every currency speaks the same language here.
          </h2>
        </motion.div>

        <div className="relative flex-1 flex items-center overflow-hidden min-h-0">
          <motion.div style={{ x: trackX }} className="flex items-stretch gap-6 sm:gap-8 px-6 sm:px-10 md:px-16 h-[68vh] sm:h-[72vh]">
            {CURRENCIES.map((c, i) => (
              <CurrencyPanel key={c.code} currency={c} index={i} scrollYProgress={smoothProgress} />
            ))}
          </motion.div>

          <div className="pointer-events-none absolute left-0 top-0 h-full w-12 sm:w-24 bg-gradient-to-r from-[var(--color-void)] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 sm:w-24 bg-gradient-to-l from-[var(--color-void)] to-transparent z-10" />
        </div>

        <div className="relative z-10 pb-8 sm:pb-10 px-6 sm:px-10 md:px-16 flex-shrink-0 flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[var(--color-bone-dim)]">
            keep scrolling
          </span>
          <div className="h-px flex-1 max-w-32 bg-[var(--color-line)]" />
        </div>
      </div>
    </section>
  )
}

function CurrencyPanel({
  currency,
  index,
  scrollYProgress,
}: {
  currency: (typeof CURRENCIES)[number]
  index: number
  scrollYProgress: ReturnType<typeof useSpring>
}) {
  const slice = 1 / CURRENCIES.length
  const center = slice * index + slice / 2
  const fadeIn = center - slice * 0.55
  const plateauStart = center - slice * 0.18
  const plateauEnd = center + slice * 0.18
  const fadeOut = center + slice * 0.55

  const scale = useTransform(
    scrollYProgress,
    [fadeIn, plateauStart, plateauEnd, fadeOut],
    [0.62, 1, 1, 0.62]
  )
  const opacity = useTransform(
    scrollYProgress,
    [fadeIn, plateauStart, plateauEnd, fadeOut],
    [0.18, 1, 1, 0.18]
  )
  const glow = useTransform(
    scrollYProgress,
    [fadeIn, plateauStart, plateauEnd, fadeOut],
    [0, 1, 1, 0]
  )
  const blur = useTransform(
    scrollYProgress,
    [fadeIn, plateauStart, plateauEnd, fadeOut],
    [6, 0, 0, 6]
  )
  const blurFilter = useTransform(blur, (v) => `blur(${v}px)`)

  return (
    <motion.div
      style={{ scale, opacity, filter: blurFilter }}
      className="relative flex-shrink-0 w-[80vw] sm:w-[50vw] md:w-[34vw] lg:w-[28vw] h-full rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden flex flex-col justify-between p-7 sm:p-10"
    >
      <motion.div
        style={{ opacity: glow }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-bullion)]/15 via-transparent to-[var(--color-emerald)]/15"
      />
      <motion.div
        style={{ opacity: glow }}
        className="pointer-events-none absolute -top-1/3 -right-1/4 w-2/3 h-2/3 rounded-full blur-3xl bg-[var(--color-bullion)]/20"
      />

      <div className="relative z-10 flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.2em] text-[var(--color-bone-dim)]">
          {String(index + 1).padStart(2, '0')} / {String(CURRENCIES.length).padStart(2, '0')}
        </span>
        <span className="font-mono text-xs tracking-[0.2em] text-[var(--color-bullion)] text-right">
          {currency.region}
        </span>
      </div>

      <div className="relative z-10">
        <div
          className="font-bold text-[var(--color-bone)] leading-none mb-4"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 9vw, 6rem)' }}
        >
          {currency.symbol}
        </div>
        <div
          className="font-bold text-[var(--color-bone)] leading-none mb-5"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
        >
          {currency.amount}
        </div>
        <div className="font-mono text-base tracking-[0.15em] text-[var(--color-emerald-bright)]">
          {currency.code}
        </div>
      </div>
    </motion.div>
  )
}