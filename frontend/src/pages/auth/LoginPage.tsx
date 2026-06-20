import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

/* ─── FX ticker data ─── */
const RATES = [
  { pair: 'USD / LBP', rate: '89,500', change: '+0.12%', up: true  },
  { pair: 'EUR / USD', rate: '1.0847',  change: '+0.08%', up: true  },
  { pair: 'GBP / AED', rate: '4.6231',  change: '−0.03%', up: false },
  { pair: 'SAR / USD', rate: '0.2666',  change: '+0.00%', up: true  },
  { pair: 'USD / EUR', rate: '0.9219',  change: '−0.08%', up: false },
  { pair: 'AED / LBP', rate: '24,373', change: '+0.15%', up: true  },
  { pair: 'GBP / USD', rate: '1.2701',  change: '+0.22%', up: true  },
  { pair: 'USD / SAR', rate: '3.7501',  change: '+0.00%', up: true  },
  { pair: 'EUR / LBP', rate: '97,038', change: '+0.20%', up: true  },
  { pair: 'AED / USD', rate: '0.2722',  change: '+0.00%', up: true  },
  { pair: 'GBP / SAR', rate: '4.7632',  change: '+0.22%', up: true  },
  { pair: 'EUR / AED', rate: '3.9823',  change: '+0.08%', up: true  },
  { pair: 'USD / GBP', rate: '0.7873',  change: '−0.22%', up: false },
  { pair: 'SAR / AED', rate: '1.0202',  change: '+0.00%', up: true  },
  { pair: 'EUR / GBP', rate: '0.8534',  change: '−0.14%', up: false },
  { pair: 'LBP / SAR', rate: '0.0000',  change: '+0.00%', up: true  },
]

/* ─── Ticker column (CSS scroll animation, framer wraps it for parallax) ─── */
function TickerColumn({
  rates,
  duration,
  delay,
  highlightIdx,
}: {
  rates: typeof RATES
  duration: string
  delay: string
  highlightIdx: number
}) {
  const doubled = [...rates, ...rates]
  return (
    <div className="overflow-hidden h-full relative">
      <div
        style={{
          animation: `tickerScroll ${duration} linear infinite`,
          animationDelay: delay,
          willChange: 'transform',
        }}
      >
        {doubled.map((r, i) => {
          const isHighlight = i % rates.length === highlightIdx
          return (
            <div
              key={i}
              style={{
                padding: '11px 8px',
                opacity: isHighlight ? 0.85 : i % 6 === 2 ? 0.18 : 0.07,
              }}
            >
              <span style={{
                display: 'block',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9.5px',
                letterSpacing: '0.06em',
                color: isHighlight ? 'rgba(200,200,220,0.9)' : '#9090a8',
                marginBottom: '2px',
              }}>
                {r.pair}
              </span>
              <span style={{
                display: 'block',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                color: isHighlight ? (r.up ? '#4ade80' : '#f87171') : '#c8c8d8',
              }}>
                {r.rate}
              </span>
              <span style={{
                display: 'block',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                letterSpacing: '0.04em',
                color: isHighlight ? (r.up ? '#4ade80' : '#f87171') : '#606078',
                marginTop: '1px',
              }}>
                {r.change}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Google icon ─── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

/* ─── Stagger variants ─── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.18 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: 'easeOut' as const },
  },
}

const headlineFade = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
}

/* ─── Page ─── */
export function LoginPage() {
  const navigate = useNavigate()
  const { setUser, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  /* scroll-based parallax */
  const { scrollY } = useScroll()
  const scrollCol1 = useTransform(scrollY, [0, 500], [0, -45])
  const scrollCol2 = useTransform(scrollY, [0, 500], [0, -70])
  const scrollCol3 = useTransform(scrollY, [0, 500], [0, -30])

  /* mouse-tracked parallax */
  const rawMouseX = useMotionValue(0)
  const rawMouseY = useMotionValue(0)
  const smoothX = useSpring(rawMouseX, { stiffness: 38, damping: 24 })
  const smoothY = useSpring(rawMouseY, { stiffness: 38, damping: 24 })

  const mouseCol1X = useTransform(smoothX, [-1, 1], [-12,  12])
  const mouseCol1Y = useTransform(smoothY, [-1, 1], [-18,  18])
  const mouseCol2X = useTransform(smoothX, [-1, 1], [  9,  -9])
  const mouseCol2Y = useTransform(smoothY, [-1, 1], [-26,  26])
  const mouseCol3X = useTransform(smoothX, [-1, 1], [ -6,   6])
  const mouseCol3Y = useTransform(smoothY, [-1, 1], [-12,  12])

  /* combine scroll + mouse Y per column */
  const col1Y = useTransform([scrollCol1, mouseCol1Y], ([s, m]: number[]) => s + m)
  const col2Y = useTransform([scrollCol2, mouseCol2Y], ([s, m]: number[]) => s + m)
  const col3Y = useTransform([scrollCol3, mouseCol3Y], ([s, m]: number[]) => s + m)

  /* glow tracks mouse */
  const glowX = useTransform(smoothX, [-1, 1], ['-80px', '80px'])
  const glowY = useTransform(smoothY, [-1, 1], ['-60px', '60px'])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { clientX, clientY } = e
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    rawMouseX.set(((clientX - left) / width)  * 2 - 1)
    rawMouseY.set(((clientY - top)  / height) * 2 - 1)
  }

  function handleMouseLeave() {
    rawMouseX.set(0)
    rawMouseY.set(0)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      setUser(res.data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const col1Rates = RATES.slice(0, 8)
  const col2Rates = [...RATES.slice(5), ...RATES.slice(0, 3)]
  const col3Rates = RATES.slice(8)

  return (
    <div
      className="flex min-h-screen"
      style={{ background: '#09090c' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >

      {/* ── Left: FX Ticker panel ── */}
      <motion.div
        className="hidden lg:block relative flex-1 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #07070b 0%, #0c0c14 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.3 }}
      >
        {/* top fade */}
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{ height: '180px', background: 'linear-gradient(to bottom, #07070b, transparent)' }}
        />
        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{ height: '180px', background: 'linear-gradient(to top, #07070b, transparent)' }}
        />
        {/* radial vignette */}
        <div className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(7,7,11,0.65) 100%)' }}
        />

        {/* Three parallax-driven ticker columns */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', padding: '0 20px' }}>
          <motion.div className="h-full" style={{ y: col1Y, x: mouseCol1X }}>
            <TickerColumn rates={col1Rates} duration="44s" delay="0s" highlightIdx={2} />
          </motion.div>
          <motion.div className="h-full" style={{ y: col2Y, x: mouseCol2X }}>
            <TickerColumn rates={col2Rates} duration="61s" delay="-18s" highlightIdx={5} />
          </motion.div>
          <motion.div className="h-full" style={{ y: col3Y, x: mouseCol3X }}>
            <TickerColumn rates={col3Rates} duration="52s" delay="-9s" highlightIdx={1} />
          </motion.div>
        </div>

        {/* Byline */}
        <motion.div
          className="absolute bottom-10 left-9 z-20"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <p style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.12)', margin: 0,
          }}>
            Live exchange rates
          </p>
        </motion.div>
      </motion.div>

      {/* ── Divider: draws in from center ── */}
      <motion.div
        className="hidden lg:block flex-shrink-0"
        style={{
          width: '1px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(79,70,229,0.38) 25%, rgba(79,70,229,0.38) 75%, transparent 100%)',
          originY: 0.5,
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.55, ease: 'easeOut' as const }}
      />

      {/* ── Right: Form panel ── */}
      <div
        className="relative flex flex-col justify-center w-full"
        style={{ maxWidth: '480px', padding: '64px 52px', background: '#0f0f13' }}
      >
        {/* Breathing glow that tracks mouse */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: '35%', left: '50%',
            width: '480px', height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
            x: glowX,
            y: glowY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{ scale: [1, 1.13, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Staggered content */}
        <motion.div variants={container} initial="hidden" animate="show">

          {/* Logo */}
          <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-14">
            <motion.div
              style={{
                height: '36px', width: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(79,70,229,0.35)',
              }}
              whileHover={{ scale: 1.08, boxShadow: '0 0 32px rgba(79,70,229,0.55)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              <span style={{ color: 'white', fontWeight: 700, fontSize: '17px', fontFamily: '"Space Grotesk", sans-serif' }}>
                R
              </span>
            </motion.div>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '19px', color: '#e8e8f2', letterSpacing: '-0.025em' }}>
              Rakiz
            </span>
          </motion.div>

          {/* Headline block */}
          <div className="mb-9">
            <motion.p
              variants={fadeUp}
              style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6366f1', marginBottom: '10px' }}
            >
              Secure access
            </motion.p>
            <motion.h1
              variants={headlineFade}
              style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '34px', fontWeight: 600, color: '#f0f0f8', letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}
            >
              Sign in.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.32)', fontFamily: '"Inter", sans-serif', lineHeight: 1.5 }}
            >
              No account?{' '}
              <Link
                to="/register"
                style={{ color: '#818cf8', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                Create one free.
              </Link>
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            variants={fadeUp}
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.52, ease: 'easeOut' as const }}
            >
              <Input
                type="email"
                placeholder="Email address"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.62, ease: 'easeOut' as const }}
            >
              <Input
                type="password"
                placeholder="Password"
                icon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.72, ease: 'easeOut' as const }}
            >
              <motion.button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 mt-1 w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  height: '46px', borderRadius: '10px',
                  background: loading ? 'rgba(79,70,229,0.7)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: 'white', fontSize: '15px',
                  fontFamily: '"Space Grotesk", sans-serif',
                  border: 'none', letterSpacing: '-0.01em',
                  boxShadow: loading ? 'none' : '0 0 28px rgba(79,70,229,0.3)',
                }}
                whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 0 44px rgba(79,70,229,0.55)' }}
                whileTap={loading ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    Continue
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.form>

          {/* Divider */}
          <motion.div
            className="flex items-center gap-3 my-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.82 }}
          >
            <div className="flex-1" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', fontFamily: '"Inter", sans-serif', letterSpacing: '0.05em' }}>
              or
            </span>
            <div className="flex-1" style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </motion.div>

          {/* Google button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <motion.button
              type="button"
              onClick={() => authApi.googleLogin()}
              className="flex items-center justify-center gap-2.5 w-full cursor-pointer"
              style={{
                height: '46px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.09)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.65)',
                fontSize: '14px', fontFamily: '"Inter", sans-serif', fontWeight: 500,
              }}
              whileHover={{
                background: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(255,255,255,0.16)',
                color: 'rgba(255,255,255,0.88)',
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
