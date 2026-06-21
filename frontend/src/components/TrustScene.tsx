import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'

const PILLARS = [
  { num: '01', title: 'Double-entry ledger', detail: 'Every transaction recorded twice, matched, and verified.' },
  { num: '02', title: 'Encrypted at rest', detail: 'Sensitive data is encrypted before it touches the database.' },
  { num: '03', title: 'Fraud detection, live', detail: 'Unusual activity is flagged the moment it happens.' },
]

export default function TrustScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const headingOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])
  const headingY = useTransform(scrollYProgress, [0.1, 0.3], [40, 0])

  return (
    <section ref={containerRef} className="relative bg-[var(--color-ink)] py-32 sm:py-40 px-6 sm:px-10 md:px-16">
      <motion.div style={{ opacity: headingOpacity, y: headingY }} className="max-w-2xl mb-20">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-[var(--color-bullion)] mb-4">
          Built to be trusted
        </p>
        <h2
          className="font-bold text-[var(--color-bone)] text-3xl sm:text-5xl md:text-6xl leading-[1.05]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Bank-grade isn't a slogan here.
        </h2>
      </motion.div>

      <div className="max-w-3xl mx-auto sm:mx-0">
        {PILLARS.map((p, i) => (
          <PillarRow key={p.num} pillar={p} index={i} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </section>
  )
}

function PillarRow({
  pillar,
  index,
  scrollYProgress,
}: {
  pillar: (typeof PILLARS)[number]
  index: number
  scrollYProgress: MotionValue<number>
}) {
  const start = 0.3 + index * 0.1
  const end = start + 0.15

  const opacity = useTransform(scrollYProgress, [start, end], [0, 1])
  const x = useTransform(scrollYProgress, [start, end], [-30, 0])

  return (
    <motion.div
      style={{ opacity, x }}
      className="flex gap-6 sm:gap-8 py-8 border-t border-[var(--color-line)]"
    >
      <span className="font-mono text-sm text-[var(--color-bullion)] flex-shrink-0 pt-1">
        {pillar.num}
      </span>
      <div>
        <h3
          className="font-semibold text-[var(--color-bone)] text-xl sm:text-2xl mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {pillar.title}
        </h3>
        <p className="text-[var(--color-bone-dim)] text-sm sm:text-base leading-relaxed max-w-md">
          {pillar.detail}
        </p>
      </div>
    </motion.div>
  )
}