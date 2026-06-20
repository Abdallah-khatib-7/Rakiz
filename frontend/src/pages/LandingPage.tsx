import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  animate,
} from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/* ─── Data ─── */
const TICKER = [
  { pair: 'USD/LBP', rate: '89,500', change: '+0.12%', up: true  },
  { pair: 'EUR/AED', rate: '3.9823',  change: '+0.08%', up: true  },
  { pair: 'GBP/SAR', rate: '4.7632',  change: '+0.22%', up: true  },
  { pair: 'SAR/USD', rate: '0.2666',  change: '+0.00%', up: true  },
  { pair: 'AED/LBP', rate: '24,373', change: '+0.15%', up: true  },
  { pair: 'EUR/LBP', rate: '97,038', change: '+0.20%', up: true  },
  { pair: 'GBP/USD', rate: '1.2701',  change: '+0.22%', up: true  },
  { pair: 'USD/SAR', rate: '3.7501',  change: '+0.00%', up: true  },
]

const STAT_SLIDES = [
  { number: '0%',       sub: 'Our markup on every exchange rate.\nNot a basis point.' },
  { number: '< 2 MIN',  sub: 'Average time money hits the\nother account. Checked weekly.'     },
  { number: 'SAR 4.2M', sub: 'Moved through Rakiz in the\nlast 7 days alone.'                  },
]

const HOW = [
  { moment: 'Fund your wallet',     detail: 'Bank transfer or card. Takes about 30 seconds.' },
  { moment: 'Set the destination',  detail: 'Pick a recipient. We show the exact rate — no margin hidden in the exchange.' },
  { moment: 'It lands',             detail: 'Usually in under 2 minutes. Both sides get notified the moment it arrives.' },
]

const HERO_WORDS = ['SEND', 'MONEY.', 'KEEP', 'IT', 'ALL.']

/* ─── SVG city-route network ─── */
const ROUTES = [
  { d: 'M340,115 Q460,65 575,230',   dur: '6s',   delays: ['0s', '3s']         },
  { d: 'M85,160 Q300,35 575,230',    dur: '9s',   delays: ['0s', '4.5s', '7s'] },
  { d: 'M575,230 Q615,285 635,370',  dur: '4s',   delays: ['0s', '2s']         },
  { d: 'M575,230 Q650,250 695,320',  dur: '4.5s', delays: ['0s', '2.2s']       },
  { d: 'M340,115 Q520,135 635,370',  dur: '7.5s', delays: ['0s', '3.8s']       },
  { d: 'M695,320 Q672,348 635,370',  dur: '3s',   delays: ['0s', '1.5s']       },
]

const CITIES = [
  { id: 'LHR', x: 340, y: 115, pulseDur: '3.2s' },
  { id: 'JFK', x: 85,  y: 160, pulseDur: '2.8s' },
  { id: 'BEY', x: 575, y: 230, pulseDur: '2.4s' },
  { id: 'RUH', x: 635, y: 370, pulseDur: '3.6s' },
  { id: 'DXB', x: 695, y: 320, pulseDur: '2.9s' },
]

/* ─── Cursor glow ─── */
function CursorGlow() {
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const sx = useSpring(x, { stiffness: 80, damping: 24 })
  const sy = useSpring(y, { stiffness: 80, damping: 24 })

  useEffect(() => {
    const fn = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [x, y])

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.055) 0%, transparent 68%)',
        x: sx, y: sy, translateX: '-50%', translateY: '-50%',
      }}
    />
  )
}

/* ─── Network background ─── */
function NetworkSVG() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="f-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="f-city">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Faint dashed route lines */}
        {ROUTES.map((r, i) => (
          <path key={i} d={r.d}
            stroke="rgba(16,185,129,0.09)" strokeWidth="0.9"
            strokeDasharray="4 7" fill="none" />
        ))}

        {/* Animated transfer particles */}
        {ROUTES.flatMap((r, ri) =>
          r.delays.map((delay, di) => (
            <circle key={`${ri}-${di}`} r="2.8" fill="#34d399" filter="url(#f-glow)">
              {/* @ts-expect-error SVG animateMotion */}
              <animateMotion dur={r.dur} begin={delay} repeatCount="indefinite" path={r.d} />
            </circle>
          ))
        )}

        {/* City nodes */}
        {CITIES.map(c => (
          <g key={c.id}>
            <circle cx={c.x} cy={c.y} r="10" fill="rgba(16,185,129,0.07)" filter="url(#f-city)">
              {/* @ts-expect-error SVG animate */}
              <animate attributeName="r" values="10;16;10" dur={c.pulseDur} repeatCount="indefinite" />
            </circle>
            <circle cx={c.x} cy={c.y} r="3" fill="rgba(52,211,153,0.5)" />
            <text x={c.x + 11} y={c.y + 4}
              fontSize="13" fontFamily='"JetBrains Mono", monospace'
              fill="rgba(236,253,245,0.2)" letterSpacing="0.08em">
              {c.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ─── Stat counter ─── */
function StatCount({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView || !ref.current) return
    const c = animate(0, to, {
      duration: 2.2, ease: 'easeOut',
      onUpdate: v => { if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString() + suffix },
    })
    return c.stop
  }, [inView, to, prefix, suffix])
  return <span ref={ref}>{prefix}0{suffix}</span>
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(6,13,10,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(16,185,129,0.09)' : '1px solid transparent',
        transition: 'background 0.35s, border-color 0.35s',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #047857, #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(16,185,129,0.38)',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: '"Space Grotesk", sans-serif' }}>R</span>
        </div>
        <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: 17, color: '#d1fae5', letterSpacing: '-0.025em' }}>
          Rakiz
        </span>
      </Link>

      <div className="hidden md:flex" style={{ gap: 36, alignItems: 'center' }}>
        {['How it works', 'Rates', 'About'].map(l => (
          <a key={l} href="#how"
            style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, color: 'rgba(236,253,245,0.45)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ecfdf5')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(236,253,245,0.45)')}
          >{l}</a>
        ))}
      </div>

      <div className="hidden md:flex" style={{ gap: 10, alignItems: 'center' }}>
        <Link to="/login" style={{ fontFamily: '"Inter", sans-serif', fontSize: 14, color: 'rgba(236,253,245,0.45)', textDecoration: 'none', padding: '8px 16px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ecfdf5')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(236,253,245,0.45)')}
        >Sign in</Link>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link to="/register" style={{
            display: 'block', padding: '9px 22px', borderRadius: 10,
            background: 'linear-gradient(135deg, #047857, #10b981)',
            boxShadow: '0 0 24px rgba(16,185,129,0.32)',
            fontFamily: '"Space Grotesk", sans-serif', fontSize: 14, fontWeight: 600,
            color: '#fff', textDecoration: 'none',
          }}>Get started</Link>
        </motion.div>
      </div>

      {/* Mobile menu button */}
      <button className="md:hidden" onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
        <div style={{ width: 22, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i} style={{ height: 1.5, background: '#ecfdf5', borderRadius: 2 }}
              animate={open ? { rotate: i === 0 ? 45 : i === 2 ? -45 : 0, y: i === 0 ? 6.5 : i === 2 ? -6.5 : 0, opacity: i === 1 ? 0 : 1 } : { rotate: 0, y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'absolute', top: 64, left: 0, right: 0,
            background: 'rgba(6,13,10,0.98)', backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(16,185,129,0.1)',
            padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          <Link to="/login" onClick={() => setOpen(false)} style={{ color: 'rgba(236,253,245,0.6)', textDecoration: 'none', fontFamily: '"Inter", sans-serif', fontSize: 15 }}>Sign in</Link>
          <Link to="/register" onClick={() => setOpen(false)} style={{
            padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #047857, #10b981)',
            fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
            color: '#fff', textDecoration: 'none', textAlign: 'center',
          }}>Get started</Link>
        </motion.div>
      )}
    </motion.nav>
  )
}

/* ─── Numbers section (pinned horizontal scroll) ─── */
function NumbersSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-66.667%'])

  return (
    <div ref={ref} style={{ height: '300vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{
            position: 'absolute', top: 40, left: 48, zIndex: 10,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: '#10b981',
          }}
        >
          The proof
        </motion.p>

        {/* Slide counter */}
        <div style={{
          position: 'absolute', top: 40, right: 48, zIndex: 10,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          color: 'rgba(236,253,245,0.2)', letterSpacing: '0.1em',
        }}>
          {STAT_SLIDES.map((_, i) => (
            <span key={i} style={{ marginLeft: i > 0 ? 8 : 0 }}>{'·'}</span>
          ))}
        </div>

        {/* Sliding strip */}
        <motion.div
          style={{
            display: 'flex', width: '300vw', height: '100vh',
            x,
          }}
        >
          {STAT_SLIDES.map((s, i) => (
            <div key={i} style={{
              width: '100vw', height: '100vh', flexShrink: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '0 80px',
              borderRight: i < 2 ? '1px solid rgba(16,185,129,0.07)' : 'none',
              position: 'relative',
            }}>
              {/* Slide background dot grid */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(rgba(16,185,129,0.05) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              <div style={{ position: 'relative' }}>
                {/* Slide number */}
                <div style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'rgba(236,253,245,0.22)', marginBottom: 32,
                }}>
                  {String(i + 1).padStart(2, '0')} / {String(STAT_SLIDES.length).padStart(2, '0')}
                </div>

                {/* The massive stat */}
                <div style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontSize: 'clamp(88px, 13vw, 180px)',
                  fontWeight: 700,
                  letterSpacing: '-0.06em',
                  lineHeight: 0.88,
                  background: 'linear-gradient(140deg, #ecfdf5 30%, #34d399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 40,
                }}>
                  {s.number}
                </div>

                {/* Divider */}
                <div style={{ width: 64, height: 1, background: 'rgba(16,185,129,0.3)', marginBottom: 28 }} />

                {/* Context */}
                <p style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: 18, lineHeight: 1.65,
                  color: 'rgba(236,253,245,0.4)',
                  whiteSpace: 'pre-line',
                  maxWidth: 440,
                }}>
                  {s.sub}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Scroll hint on first view */}
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
        >
          <motion.div
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'rgba(16,185,129,0.35)' }}
          >
            <ArrowRight size={16} />
          </motion.div>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(236,253,245,0.18)',
          }}>scroll</span>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── How section (scroll-driven line) ─── */
function HowSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 20%'] })

  const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  const s1o = useTransform(scrollYProgress, [0.08, 0.22], [0, 1])
  const s1x = useTransform(scrollYProgress, [0.08, 0.22], [28, 0])
  const s2o = useTransform(scrollYProgress, [0.36, 0.52], [0, 1])
  const s2x = useTransform(scrollYProgress, [0.36, 0.52], [28, 0])
  const s3o = useTransform(scrollYProgress, [0.64, 0.8], [0, 1])
  const s3x = useTransform(scrollYProgress, [0.64, 0.8], [28, 0])

  const stepOpacities = [s1o, s2o, s3o]
  const stepXs = [s1x, s2x, s3x]

  return (
    <section id="how" ref={ref} style={{ padding: '160px 40px', position: 'relative', background: '#060d0a' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ marginBottom: 100 }}
        >
          <p style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#10b981', marginBottom: 16,
          }}>How it works</p>
          <h2 style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 700, color: '#ecfdf5',
            letterSpacing: '-0.045em', lineHeight: 1.02,
            maxWidth: 520,
          }}>
            Three moments.<br />No surprises.
          </h2>
        </motion.div>

        {/* Line + steps */}
        <div style={{ position: 'relative', paddingLeft: 72 }}>
          {/* The drawing line */}
          <motion.div style={{
            position: 'absolute', left: 24, top: 0, bottom: 0,
            width: 1,
            background: 'linear-gradient(to bottom, #10b981, rgba(16,185,129,0.15))',
            scaleY: lineScaleY,
            transformOrigin: 'top',
          }} />

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
            {HOW.map((step, i) => (
              <motion.div
                key={step.moment}
                style={{ opacity: stepOpacities[i], x: stepXs[i] }}
              >
                {/* Node on line */}
                <div style={{
                  position: 'absolute', left: 18, marginTop: 4,
                  width: 13, height: 13, borderRadius: '50%',
                  background: '#060d0a',
                  border: '1px solid rgba(16,185,129,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                </div>

                <h3 style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontSize: 'clamp(22px, 2.5vw, 30px)',
                  fontWeight: 600, color: '#ecfdf5',
                  letterSpacing: '-0.03em', marginBottom: 12,
                }}>
                  {step.moment}
                </h3>
                <p style={{
                  fontFamily: '"Inter", sans-serif', fontSize: 16,
                  color: 'rgba(236,253,245,0.38)', lineHeight: 1.7,
                  maxWidth: 480,
                }}>
                  {step.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Quote section (full viewport) ─── */
function QuoteSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [80, -80])

  return (
    <section ref={ref} style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      background: '#040a06', position: 'relative', overflow: 'hidden',
    }}>
      {/* ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 800, height: 600, borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div style={{ y, maxWidth: 1160, margin: '0 auto', padding: '0 60px', position: 'relative' }}>
        <motion.p
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 'clamp(26px, 4.5vw, 56px)',
            fontWeight: 600,
            color: '#ecfdf5',
            letterSpacing: '-0.04em',
            lineHeight: 1.18,
            fontStyle: 'italic',
            marginBottom: 48,
          }}
        >
          "Transferred SAR&nbsp;8,000 from London to my sister in Riyadh. It arrived before I finished my tea. The bank would have taken SAR&nbsp;400 for the same transfer. Rakiz took nothing."
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #047857, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Space Grotesk", sans-serif', fontSize: 13,
            fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>FA</div>
          <div>
            <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 14, fontWeight: 600, color: '#ecfdf5' }}>
              Fatima A.
            </div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.1em', color: 'rgba(236,253,245,0.3)', marginTop: 3 }}>
              LONDON → RIYADH
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ─── Landing page ─── */
export function LandingPage() {
  return (
    <div style={{ background: '#060d0a', overflowX: 'hidden' }}>
      <CursorGlow />
      <Navbar />

      {/* ══════ HERO ══════ */}
      <section style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '120px 60px 0',
        overflow: 'hidden',
      }}>
        <NetworkSVG />

        {/* Gradient overlay to ground the hero */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(6,13,10,0.65) 100%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1160, margin: '0 auto', width: '100%' }}>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}
          >
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(52,211,153,0.7)',
            }}>
              Live · Trusted by 12,800 users
            </span>
          </motion.div>

          {/* Headline — word by word */}
          <div style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(64px, 10vw, 138px)',
            letterSpacing: '-0.055em',
            lineHeight: 0.9,
            marginBottom: 40,
            userSelect: 'none',
          }}>
            {/* Line 1 */}
            <div>
              {['SEND', 'MONEY.'].map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 48, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.85, delay: 0.2 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'inline-block', marginRight: '0.18em', color: '#ecfdf5' }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
            {/* Line 2 — gradient */}
            <div>
              {['KEEP', 'IT', 'ALL.'].map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 48, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.85, delay: 0.48 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'inline-block', marginRight: '0.18em',
                    background: 'linear-gradient(135deg, #34d399 0%, #10b981 60%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.88 }}
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 'clamp(11px, 1.2vw, 13px)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(236,253,245,0.35)',
              marginBottom: 48,
            }}
          >
            Beirut · Riyadh · Dubai · London · Real rates · Zero markup
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.02 }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 80 }}
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 30px', borderRadius: 12,
                background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                boxShadow: '0 0 48px rgba(16,185,129,0.35)',
                fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
                color: '#fff', textDecoration: 'none',
              }}>
                Create account
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                  <ArrowRight size={16} />
                </motion.span>
              </Link>
            </motion.div>
            <a href="#how" style={{
              fontFamily: '"Inter", sans-serif', fontSize: 14,
              color: 'rgba(236,253,245,0.4)', textDecoration: 'none',
              padding: '14px 24px', borderRadius: 12,
              border: '1px solid rgba(16,185,129,0.13)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ecfdf5'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.28)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(236,253,245,0.4)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.13)' }}
            >
              See how it works ↓
            </a>
          </motion.div>
        </div>

        {/* FX Ticker — bottom of hero */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          style={{
            position: 'relative', zIndex: 2,
            borderTop: '1px solid rgba(16,185,129,0.08)',
            background: 'rgba(6,13,10,0.6)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
            /* fade mask on both sides */
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', width: 'max-content', animation: 'tickerScrollX 26s linear infinite' }}>
            {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', flexShrink: 0,
                borderRight: '1px solid rgba(16,185,129,0.06)',
              }}>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'rgba(236,253,245,0.22)', letterSpacing: '0.08em' }}>
                  {t.pair}
                </span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 500, color: 'rgba(236,253,245,0.55)' }}>
                  {t.rate}
                </span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: t.up ? '#34d399' : '#f87171' }}>
                  {t.change}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════ NUMBERS ══════ */}
      <NumbersSection />

      {/* ══════ HOW ══════ */}
      <HowSection />

      {/* ══════ STATS ROW ══════ */}
      <section style={{
        padding: '80px 60px',
        borderTop: '1px solid rgba(16,185,129,0.07)',
        borderBottom: '1px solid rgba(16,185,129,0.07)',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { to: 12800,   suffix: '+', label: 'Active users'           },
            { to: 6,                    label: 'Corridors supported'     },
            { raw: '98.7%',             label: 'Transfer success rate'   },
            { to: 4200000, prefix: 'SAR ', label: 'Moved this week'     },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 700,
                letterSpacing: '-0.04em', lineHeight: 1,
                background: 'linear-gradient(135deg, #ecfdf5 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 8,
              }}>
                {'raw' in s ? s.raw : <StatCount to={s.to!} prefix={s.prefix} suffix={s.suffix} />}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(236,253,245,0.3)', fontFamily: '"Inter", sans-serif', letterSpacing: '0.02em' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ QUOTE ══════ */}
      <QuoteSection />

      {/* ══════ CTA ══════ */}
      <section style={{ padding: '140px 60px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{
              padding: '100px 80px',
              borderRadius: 28,
              background: 'linear-gradient(135deg, #071a10 0%, #0c2418 50%, #071a10 100%)',
              border: '1px solid rgba(16,185,129,0.18)',
              boxShadow: '0 0 120px rgba(16,185,129,0.06)',
              textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Inner glow */}
            <div style={{
              position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
              width: 800, height: 600, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 65%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
              <motion.p
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: '#10b981', marginBottom: 20,
                }}
              >
                Your first transfer is free
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: 0.2 }}
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontSize: 'clamp(40px, 6vw, 76px)',
                  fontWeight: 700,
                  color: '#ecfdf5',
                  letterSpacing: '-0.05em',
                  lineHeight: 0.96,
                  marginBottom: 44,
                }}
              >
                Start moving money<br />the right way.
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.38 }}
                style={{ display: 'inline-block' }}
              >
                <motion.div
                  whileHover={{ scale: 1.06, boxShadow: '0 0 80px rgba(16,185,129,0.55)' }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <Link to="/register" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '17px 44px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    boxShadow: '0 0 56px rgba(16,185,129,0.42)',
                    fontFamily: '"Space Grotesk", sans-serif', fontSize: 17, fontWeight: 600,
                    color: '#fff', textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}>
                    Create account <ArrowRight size={18} />
                  </Link>
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.55 }}
                style={{ marginTop: 20, fontSize: 12, color: 'rgba(236,253,245,0.22)', fontFamily: '"Inter", sans-serif' }}
              >
                No credit card · No monthly fee · Cancel anytime
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer style={{ borderTop: '1px solid rgba(16,185,129,0.07)', padding: '48px 60px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #047857, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: '"Space Grotesk", sans-serif' }}>R</span>
            </div>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: 15, color: '#d1fae5', letterSpacing: '-0.025em' }}>Rakiz</span>
          </div>

          <div className="hidden md:flex" style={{ gap: 32 }}>
            {['Privacy', 'Terms', 'Security', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontFamily: '"Inter", sans-serif', fontSize: 13, color: 'rgba(236,253,245,0.28)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ecfdf5')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(236,253,245,0.28)')}
              >{l}</a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(236,253,245,0.18)' }}>
              All systems operational
            </span>
          </div>
        </div>
        <div style={{ maxWidth: 1160, margin: '24px auto 0', borderTop: '1px solid rgba(16,185,129,0.05)', paddingTop: 24 }}>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: 12, color: 'rgba(236,253,245,0.15)' }}>
            © 2025 Rakiz. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
