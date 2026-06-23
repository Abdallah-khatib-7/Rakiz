import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MagneticButton from './MagneticButton'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Instant transfers</span> <span className="text-[var(--color-emerald-bright)]/60">✦</span>
    <span>Six currencies</span> <span className="text-[var(--color-bullion)]/60">✦</span>
    <span>Double-entry ledger</span> <span className="text-[var(--color-emerald-bright)]/60">✦</span>
    <span>Built on trust</span> <span className="text-[var(--color-bullion)]/60">✦</span>
    <span>Bank-grade security</span> <span className="text-[var(--color-emerald-bright)]/60">✦</span>
  </div>
)

export default function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const giantTextRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !wrapperRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: '10vh', scale: 0.8, opacity: 0 },
        {
          y: '0vh',
          scale: 1,
          opacity: 1,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 80%',
            end: 'bottom bottom',
            scrub: 1,
          },
        }
      )

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 40%',
            end: 'bottom bottom',
            scrub: 1,
          },
        }
      )
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      ref={wrapperRef}
      className="relative h-screen w-full"
      style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}
    >
      <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[var(--color-void)] text-[var(--color-bone)]">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[80px] pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(0,210,122,0.12) 0%, rgba(201,160,78,0.1) 40%, transparent 70%)',
            animation: 'footer-breathe 8s ease-in-out infinite alternate',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage:
              'linear-gradient(to right, rgba(236,230,216,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,230,216,0.04) 1px, transparent 1px)',
            maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
          }}
        />

        <div
          ref={giantTextRef}
          className="absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none font-black"
          style={{
            fontSize: '26vw',
            lineHeight: 0.75,
            letterSpacing: '-0.05em',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(236,230,216,0.05)',
            background: 'linear-gradient(180deg, rgba(236,230,216,0.1) 0%, transparent 60%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            fontFamily: 'var(--font-display)',
          }}
        >
          RAKIZ
        </div>

        <div className="absolute top-12 left-0 w-full overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-void)]/60 backdrop-blur-md py-4 z-10 -rotate-2 scale-110 shadow-2xl">
          <div
            className="flex w-max text-xs md:text-sm font-bold tracking-[0.3em] text-[var(--color-bone-dim)] uppercase"
            style={{ animation: 'footer-scroll-marquee 40s linear infinite' }}
          >
            <MarqueeItem />
            <MarqueeItem />
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-20 w-full max-w-5xl mx-auto">
          <h2
            ref={headingRef}
            className="text-5xl md:text-8xl font-black tracking-tighter mb-12 text-center"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(180deg, var(--color-bone) 0%, rgba(236,230,216,0.4) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0px 0px 20px rgba(236,230,216,0.1))',
            }}
          >
            Ready to begin?
          </h2>

          <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-wrap justify-center gap-4 w-full">
              <MagneticButton
                as="a"
                href="/register"
                className="footer-glass-pill px-10 py-5 rounded-full text-[var(--color-bone)] font-bold text-sm md:text-base"
              >
                Create your account
              </MagneticButton>
              <MagneticButton
                as="a"
                href="/login"
                className="footer-glass-pill px-10 py-5 rounded-full text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] font-bold text-sm md:text-base transition-colors"
              >
                Sign in
              </MagneticButton>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-2">
              <MagneticButton
                as="a"
                href="/privacy"
                className="footer-glass-pill px-6 py-3 rounded-full text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] font-medium text-xs md:text-sm transition-colors"
              >
                Privacy Policy
              </MagneticButton>
              <MagneticButton
                as="a"
                href="/terms"
                className="footer-glass-pill px-6 py-3 rounded-full text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] font-medium text-xs md:text-sm transition-colors"
              >
                Terms of Service
              </MagneticButton>
              <MagneticButton
                as="a"
                href="/contact"
                className="footer-glass-pill px-6 py-3 rounded-full text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] font-medium text-xs md:text-sm transition-colors"
              >
                Contact
              </MagneticButton>
            </div>
          </div>
        </div>

        <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[var(--color-bone-dim)] text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
            © 2026 Rakiz. All rights reserved.
          </div>

          <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default">
            <span className="text-[var(--color-bone-dim)] text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Built in
            </span>
            <span className="text-[var(--color-bullion)] text-sm md:text-base">●</span>
            <span className="text-[var(--color-bone-dim)] text-[10px] md:text-xs font-bold uppercase tracking-widest">
              Beirut
            </span>
          </div>

          <MagneticButton
            as="button"
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] order-3 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </MagneticButton>
        </div>
      </footer>
    </div>
  )
}