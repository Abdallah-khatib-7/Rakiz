import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

export default function SendScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 20, mass: 0.5 })

  // the amount drops from above the viewport, overshoots slightly past
  // center (the "impact"), then settles — a spring-driven fall, not a linear one
  const dropY = useTransform(smooth, [0, 0.35, 0.45, 0.55, 1], ['-60vh', '4vh', '-2vh', '0vh', '0vh'])
  const dropBlur = useTransform(smooth, [0, 0.3, 0.4], [14, 4, 0])
  const dropBlurFilter = useTransform(dropBlur, (v) => `blur(${v}px)`)
  const dropScale = useTransform(smooth, [0, 0.35, 0.45], [0.7, 1.04, 1])

  const impactRingScale = useTransform(smooth, [0.38, 0.55], [0, 2.4])
  const impactRingOpacity = useTransform(smooth, [0.38, 0.42, 0.55], [0, 0.5, 0])

  const recipientOpacity = useTransform(smooth, [0.45, 0.58], [0, 1])
  const recipientY = useTransform(smooth, [0.45, 0.58], [14, 0])

  const badgeOpacity = useTransform(smooth, [0.65, 0.8], [0, 1])
  const badgeScale = useTransform(smooth, [0.65, 0.8], [0.8, 1])

  const bgShift = useTransform(smooth, [0, 0.4, 1], [
    'radial-gradient(60% 50% at 50% 0%, rgba(201,160,78,0.0) 0%, transparent 70%)',
    'radial-gradient(70% 60% at 50% 45%, rgba(201,160,78,0.18) 0%, transparent 70%)',
    'radial-gradient(70% 60% at 50% 45%, rgba(10,135,84,0.12) 0%, transparent 70%)',
  ])

  return (
    <section ref={containerRef} style={{ height: '380vh' }} className="relative bg-[var(--color-void)]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <motion.div style={{ background: bgShift }} className="absolute inset-0 pointer-events-none" />

        <div className="absolute top-12 sm:top-16 left-6 sm:left-10 md:left-16 z-10">
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-3">
            Sent in an instant
          </p>
          <h2
            className="font-bold text-[var(--color-bone)] text-2xl sm:text-4xl md:text-5xl max-w-xl leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Money doesn't wait in line.
          </h2>
        </div>

        <div className="relative flex flex-col items-center justify-center">
          {/* impact shockwave ring */}
          <motion.div
            style={{ scale: impactRingScale, opacity: impactRingOpacity }}
            className="absolute w-40 h-40 sm:w-56 sm:h-56 rounded-full border-2 border-[var(--color-bullion)]"
          />

          <motion.div
            style={{ y: dropY, filter: dropBlurFilter, scale: dropScale }}
            className="relative z-10 font-bold text-[var(--color-bone)] leading-none text-center"
          >
            <span
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4rem, 16vw, 11rem)' }}
              className="block"
            >
              $250
            </span>
          </motion.div>

          <motion.div
            style={{ opacity: recipientOpacity, y: recipientY }}
            className="mt-6 text-center"
          >
            <p className="font-mono text-sm tracking-[0.15em] text-[var(--color-bone-dim)] uppercase">
              to Sara Haddad
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: badgeOpacity, scale: badgeScale }}
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-emerald-bright)]/40 bg-[var(--color-emerald)]/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-emerald-bright)]" />
            <span className="font-mono text-xs tracking-[0.15em] uppercase text-[var(--color-emerald-bright)]">
              settled in 0.4s
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}