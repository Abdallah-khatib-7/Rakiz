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

/* ─── Ticker column ─── */
function TickerColumn({
  rates, duration, delay, highlightIdx,
}: {
  rates: typeof RATES
  duration: string
  delay: string
  highlightIdx: number
}) {
  const doubled = [...rates, ...rates]
  return (
    <div className="overflow-hidden h-full relative">
      <div style={{ animation: `tickerScroll ${duration} linear infinite`, animationDelay: delay, willChange: 'transform' }}>
        {doubled.map((r, i) => {
          const isHighlight = i % rates.length === highlightIdx
          return (
            <div key={i} style={{ padding: '11px 8px', opacity: isHighlight ? 0.88 : i % 6 === 2 ? 0.18 : 0.06 }}>
              <span style={{
                display: 'block', fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px', letterSpacing: '0.08em',
                color: isHighlight ? 'rgba(167,243,208,0.75)' : '#2d5c4a', marginBottom: '2px',
              }}>
                {r.pair}
              </span>
              <span style={{
                display: 'block', fontFamily: '"JetBrains Mono", monospace',
                fontSize: '13.5px', fontWeight: 500, letterSpacing: '0.02em',
                color: isHighlight ? (r.up ? '#34d399' : '#f87171') : '#1e4a38',
              }}>
                {r.rate}
              </span>
              <span style={{
                display: 'block', fontFamily: '"JetBrains Mono", monospace',
                fontSize: '8.5px', letterSpacing: '0.04em',
                color: isHighlight ? (r.up ? '#34d399' : '#f87171') : '#163829', marginTop: '1px',
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
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: 'easeOut' as const } },
}
const headlineFade = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: 'easeOut' as const } },
}

const STATS = [
  { value: '12,800+', label: 'Active Users' },
  { value: 'SAR 4M+', label: 'Daily Volume'  },
  { value: '98.7%',   label: 'Success Rate'  },
]

/* ─── Page ─── */
export function LoginPage() {
  const navigate = useNavigate()
  const { setUser, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { scrollY } = useScroll()
  const scrollCol1 = useTransform(scrollY, [0, 500], [0, -45])
  const scrollCol2 = useTransform(scrollY, [0, 500], [0, -70])
  const scrollCol3 = useTransform(scrollY, [0, 500], [0, -30])

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

  const col1Y = useTransform([scrollCol1, mouseCol1Y], ([s, m]: number[]) => s + m)
  const col2Y = useTransform([scrollCol2, mouseCol2Y], ([s, m]: number[]) => s + m)
  const col3Y = useTransform([scrollCol3, mouseCol3Y], ([s, m]: number[]) => s + m)

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
      style={{ background: '#060d0a' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >

      {/* ── Left: Brand Showcase ── */}
      <motion.div
        className="hidden lg:flex flex-col relative flex-1 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #060d0a 0%, #071410 60%, #060d0a 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.3 }}
      >
        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(16,185,129,0.07) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Top-right ambient glow */}
        <div className="absolute pointer-events-none" style={{
          top: '-15%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)',
        }} />

        {/* Bottom-left ambient glow */}
        <div className="absolute pointer-events-none" style={{
          bottom: '10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)',
        }} />

        {/* Logo */}
        <motion.div
          className="relative z-20 flex items-center gap-2.5"
          style={{ padding: '40px 48px' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div style={{
            height: '34px', width: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #047857, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 22px rgba(16,185,129,0.35)',
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '16px', fontFamily: '"Space Grotesk", sans-serif' }}>R</span>
          </div>
          <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '18px', color: '#d1fae5', letterSpacing: '-0.025em' }}>
            Rakiz
          </span>
        </motion.div>

        {/* Hero content */}
        <div className="relative z-20 flex flex-col justify-center flex-1 px-12" style={{ paddingBottom: '20px' }}>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '10px', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: '#10b981', marginBottom: '20px',
            }}
          >
            Global money transfer
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, delay: 0.85 }}
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: '48px', fontWeight: 700,
              color: '#ecfdf5', letterSpacing: '-0.04em',
              lineHeight: 1.06, marginBottom: '20px',
            }}
          >
            Move money<br />
            <span style={{
              background: 'linear-gradient(135deg, #34d399, #10b981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              without borders.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.05 }}
            style={{
              fontSize: '15px', color: 'rgba(236,253,245,0.38)',
              fontFamily: '"Inter", sans-serif', lineHeight: 1.65,
              maxWidth: '360px', marginBottom: '44px',
            }}
          >
            Send funds across the Middle East instantly. Competitive rates, zero hidden fees.
          </motion.p>

          {/* Stat cards */}
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                style={{
                  flex: 1, padding: '16px 14px', borderRadius: '14px',
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.13)',
                }}
                whileHover={{ background: 'rgba(16,185,129,0.09)', borderColor: 'rgba(16,185,129,0.22)' }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontSize: '21px', fontWeight: 700,
                  background: i === 0
                    ? 'linear-gradient(135deg, #34d399, #6ee7b7)'
                    : i === 1
                      ? 'linear-gradient(135deg, #10b981, #34d399)'
                      : 'linear-gradient(135deg, #6ee7b7, #a7f3d0)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.03em', marginBottom: '5px',
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '11px', color: 'rgba(236,253,245,0.3)',
                  letterSpacing: '0.02em',
                }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* FX Ticker ─ bottom strip */}
        <div className="relative flex-shrink-0" style={{ height: '260px' }}>
          <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
            style={{ height: '100px', background: 'linear-gradient(to bottom, #060d0a, transparent)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
            style={{ height: '70px', background: 'linear-gradient(to top, #060d0a, transparent)' }}
          />
          <div className="absolute inset-0 z-10 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(6,13,10,0.55) 100%)' }}
          />
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
        </div>

        {/* Live rates label */}
        <motion.div
          className="relative z-20 flex items-center gap-2.5 pb-8 pl-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <span className="live-dot" />
          <p style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '9.5px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(236,253,245,0.18)', margin: 0,
          }}>
            Live exchange rates
          </p>
        </motion.div>
      </motion.div>

      {/* ── Divider ── */}
      <motion.div
        className="hidden lg:block flex-shrink-0"
        style={{
          width: '1px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.22) 30%, rgba(16,185,129,0.22) 70%, transparent 100%)',
          originY: 0.5,
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.55, ease: 'easeOut' as const }}
      />

      {/* ── Right: Form panel ── */}
      <div
        className="relative flex flex-col justify-center w-full"
        style={{ maxWidth: '480px', padding: '64px 52px', background: '#09120f' }}
      >
        {/* Breathing emerald glow tracks mouse */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: '35%', left: '50%',
            width: '520px', height: '520px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
            x: glowX, y: glowY, translateX: '-50%', translateY: '-50%',
          }}
          animate={{ scale: [1, 1.14, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div variants={container} initial="hidden" animate="show">

          {/* Logo — mobile only */}
          <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-14 lg:hidden">
            <div style={{
              height: '34px', width: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #047857, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 22px rgba(16,185,129,0.35)',
            }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '16px', fontFamily: '"Space Grotesk", sans-serif' }}>R</span>
            </div>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: '18px', color: '#d1fae5', letterSpacing: '-0.025em' }}>Rakiz</span>
          </motion.div>

          {/* Headline */}
          <div className="mb-9">
            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '10px', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: '#10b981', marginBottom: '10px',
              }}
            >
              Secure access
            </motion.p>
            <motion.h1
              variants={headlineFade}
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: '36px', fontWeight: 700,
                color: '#ecfdf5', letterSpacing: '-0.035em',
                lineHeight: 1.08, margin: 0,
              }}
            >
              Welcome back.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(236,253,245,0.3)', fontFamily: '"Inter", sans-serif', lineHeight: 1.5 }}
            >
              No account?{' '}
              <Link
                to="/register"
                style={{ color: '#34d399', textDecoration: 'none', transition: 'opacity 0.15s' }}
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

            {/* Forgot password */}
            <motion.div
              className="flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.68 }}
            >
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '12px', fontFamily: '"Inter", sans-serif',
                  color: 'rgba(52,211,153,0.5)', textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(52,211,153,0.5)')}
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.74, ease: 'easeOut' as const }}
            >
              <motion.button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 mt-1 w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  height: '48px', borderRadius: '12px',
                  background: loading
                    ? 'rgba(16,185,129,0.45)'
                    : 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                  color: 'white', fontSize: '15px',
                  fontFamily: '"Space Grotesk", sans-serif',
                  border: 'none', letterSpacing: '-0.01em',
                  boxShadow: loading ? 'none' : '0 0 32px rgba(16,185,129,0.28)',
                }}
                whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 0 52px rgba(16,185,129,0.48)' }}
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
                    Sign in
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
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
            transition={{ duration: 0.5, delay: 0.84 }}
          >
            <div className="flex-1" style={{ height: '1px', background: 'rgba(16,185,129,0.1)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(236,253,245,0.2)', fontFamily: '"Inter", sans-serif', letterSpacing: '0.05em' }}>or</span>
            <div className="flex-1" style={{ height: '1px', background: 'rgba(16,185,129,0.1)' }} />
          </motion.div>

          {/* Google */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.92 }}
          >
            <motion.button
              type="button"
              onClick={() => authApi.googleLogin()}
              className="flex items-center justify-center gap-2.5 w-full cursor-pointer"
              style={{
                height: '48px', borderRadius: '12px',
                border: '1px solid rgba(16,185,129,0.11)',
                background: 'rgba(16,185,129,0.03)',
                color: 'rgba(236,253,245,0.5)',
                fontSize: '14px', fontFamily: '"Inter", sans-serif', fontWeight: 500,
              }}
              whileHover={{
                background: 'rgba(16,185,129,0.08)',
                borderColor: 'rgba(16,185,129,0.22)',
                color: 'rgba(236,253,245,0.85)',
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
