import { useEffect, useRef, type ReactNode } from 'react'

function VerticalMarquee({ children, speed = 22 }: { children: ReactNode; speed?: number }) {
  return (
    <div className="group flex flex-col overflow-hidden h-full" style={{ '--duration': `${speed}s` } as React.CSSProperties}>
      <div className="flex shrink-0 flex-col animate-marquee-vertical">{children}</div>
      <div className="flex shrink-0 flex-col animate-marquee-vertical" aria-hidden="true">{children}</div>
    </div>
  )
}

const MARQUEE_ITEMS = ['Freelancers', 'Small teams', 'Families abroad', 'Online sellers', 'Anyone moving money']

export default function CTAScene() {
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = marqueeRef.current
    if (!container) return

    const update = () => {
      const items = container.querySelectorAll('.marquee-item')
      const rect = container.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect()
        const itemCenterY = itemRect.top + itemRect.height / 2
        const distance = Math.abs(centerY - itemCenterY)
        const normalized = Math.min(distance / (rect.height / 2), 1)
        ;(item as HTMLElement).style.opacity = (1 - normalized * 0.8).toString()
      })
    }

    let frame: number
    const loop = () => {
      update()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section className="relative min-h-screen bg-[var(--color-void)] flex items-center px-6 sm:px-10 md:px-16 py-24 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="space-y-8 max-w-xl">
          <h2 className="font-bold text-[var(--color-bone)] text-4xl sm:text-6xl md:text-7xl leading-[0.95]" style={{ fontFamily: 'var(--font-display)' }}>
            Your foundation starts here.
          </h2>
          <p className="text-[var(--color-bone-dim)] text-lg sm:text-xl leading-relaxed">
            Six currencies. One wallet. Built for whoever needs money to move without friction.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/register" className="px-7 py-3.5 bg-[var(--color-emerald-bright)] text-[var(--color-void)] rounded-full font-semibold transition-transform hover:scale-105">Create your account</a>
            <a href="/login" className="px-7 py-3.5 rounded-full font-semibold border border-[var(--color-line)] text-[var(--color-bone)] transition-transform hover:scale-105">Sign in</a>
          </div>
        </div>

        <div ref={marqueeRef} className="relative h-[420px] sm:h-[520px] flex items-center justify-center">
          <VerticalMarquee speed={18}>
            {MARQUEE_ITEMS.map((item, i) => (
              <div key={i} className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight py-7 marquee-item text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
                {item}
              </div>
            ))}
          </VerticalMarquee>

          <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 sm:h-48 bg-gradient-to-b from-[var(--color-void)] via-[var(--color-void)]/60 to-transparent z-10" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 sm:h-48 bg-gradient-to-t from-[var(--color-void)] via-[var(--color-void)]/60 to-transparent z-10" />
        </div>
      </div>
    </section>
  )
}