import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

const SHARDS = [
  { name: 'Aboudi', amount: '25.00', startX: -8, startY: -4, endX: -34, endY: -26, rotate: -18, delay: 0 },
  { name: 'Sara', amount: '25.00', startX: 6, startY: -6, endX: 30, endY: -22, rotate: 14, delay: 0.05 },
  { name: 'Karim', amount: '25.00', startX: -5, startY: 5, endX: -28, endY: 24, rotate: 22, delay: 0.1 },
  { name: 'Lina', amount: '25.00', startX: 7, startY: 4, endX: 32, endY: 28, rotate: -16, delay: 0.15 },
]

export default function SplitScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const smooth = useSpring(scrollYProgress, { stiffness: 85, damping: 22, mass: 0.45 })

  const wholeOpacity = useTransform(smooth, [0, 0.12, 0.22], [1, 1, 0])
  const wholeScale = useTransform(smooth, [0, 0.22], [1, 1.15])

  const crackOpacity = useTransform(smooth, [0.08, 0.18, 0.24], [0, 1, 0])

  const shardsOpacity = useTransform(smooth, [0.18, 0.3], [0, 1])

  return (
    <section ref={containerRef} style={{ height: '420vh' }} className="relative bg-[var(--color-void)]">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute top-12 sm:top-16 left-6 sm:left-10 md:left-16 z-20 right-6 sm:right-auto">
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-3">
            One bill, fairly broken
          </p>
          <h2
            className="font-bold text-[var(--color-bone)] text-2xl sm:text-4xl md:text-5xl max-w-xl leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Split it. Nobody fronts the rest.
          </h2>
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div
            style={{ opacity: wholeOpacity, scale: wholeScale }}
            className="absolute font-bold text-[var(--color-bone)] leading-none text-center"
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3.5rem, 13vw, 9rem)' }}>
              $100
            </span>
          </motion.div>

          <motion.svg
            style={{ opacity: crackOpacity }}
            className="absolute w-64 h-64 sm:w-80 sm:h-80 pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path d="M100 10 L92 70 L120 95 L80 120 L108 160 L100 190" stroke="var(--color-bullion)" strokeWidth="1.5" />
            <path d="M30 100 L70 92 L95 120 L120 80 L160 108" stroke="var(--color-bullion)" strokeWidth="1.5" />
          </motion.svg>

          <motion.div style={{ opacity: shardsOpacity }} className="absolute inset-0">
            {SHARDS.map((s) => (
              <Shard key={s.name} shard={s} progress={smooth} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Shard({
  shard,
  progress,
}: {
  shard: (typeof SHARDS)[number]
  progress: ReturnType<typeof useSpring>
}) {
  const start = 0.24 + shard.delay
  const settle = start + 0.16
  const lockIn = settle + 0.1

  const x = useTransform(progress, [start, settle], [`${shard.startX}%`, `${shard.endX}%`])
  const y = useTransform(progress, [start, settle], [`${shard.startY}%`, `${shard.endY}%`])
  const rotate = useTransform(progress, [start, settle], [0, shard.rotate])
  const scale = useTransform(progress, [start, settle, lockIn], [0.3, 1.1, 1])
  const ringOpacity = useTransform(progress, [settle, lockIn, lockIn + 0.05], [0, 0.6, 0])
  const checkOpacity = useTransform(progress, [lockIn, lockIn + 0.06], [0, 1])

  return (
    <motion.div
      style={{ x, y, rotate, scale }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="relative w-32 sm:w-40 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 flex flex-col items-center gap-2 shadow-2xl shadow-black/50">
        <motion.div
          style={{ opacity: ringOpacity }}
          className="absolute inset-0 rounded-2xl border-2 border-[var(--color-emerald-bright)]"
        />
        <span
          className="font-bold text-[var(--color-bone)] leading-none"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)' }}
        >
          ${shard.amount}
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--color-bone-dim)]">
          {shard.name}
        </span>
        <motion.div
          style={{ opacity: checkOpacity }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--color-emerald-bright)] flex items-center justify-center"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="var(--color-void)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  )
}