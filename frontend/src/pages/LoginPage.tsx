import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Mail } from 'lucide-react'

interface PupilProps {
  size?: number
  maxDistance?: number
  pupilColor?: string
  mouseX: number
  mouseY: number
  forceLookX?: number
  forceLookY?: number
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = 'black', mouseX, mouseY, forceLookX, forceLookY }: PupilProps) {
  const pupilRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let raf: number
    if (forceLookX !== undefined && forceLookY !== undefined) {
      raf = requestAnimationFrame(() => setPos({ x: forceLookX, y: forceLookY }))
    } else if (pupilRef.current) {
      const pupil = pupilRef.current.getBoundingClientRect()
      const pupilCenterX = pupil.left + pupil.width / 2
      const pupilCenterY = pupil.top + pupil.height / 2
      const deltaX = mouseX - pupilCenterX
      const deltaY = mouseY - pupilCenterY
      const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)
      const angle = Math.atan2(deltaY, deltaX)
      raf = requestAnimationFrame(() => setPos({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }))
    }
    return () => cancelAnimationFrame(raf)
  }, [mouseX, mouseY, forceLookX, forceLookY, maxDistance])

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  )
}

interface EyeBallProps {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
  mouseX: number
  mouseY: number
  forceLookX?: number
  forceLookY?: number
}

function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = 'black',
  isBlinking = false,
  mouseX,
  mouseY,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const eyeRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let raf: number
    if (forceLookX !== undefined && forceLookY !== undefined) {
      raf = requestAnimationFrame(() => setPos({ x: forceLookX, y: forceLookY }))
    } else if (eyeRef.current) {
      const eye = eyeRef.current.getBoundingClientRect()
      const eyeCenterX = eye.left + eye.width / 2
      const eyeCenterY = eye.top + eye.height / 2
      const deltaX = mouseX - eyeCenterX
      const deltaY = mouseY - eyeCenterY
      const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)
      const angle = Math.atan2(deltaY, deltaX)
      raf = requestAnimationFrame(() => setPos({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }))
    }
    return () => cancelAnimationFrame(raf)
  }, [mouseX, mouseY, forceLookX, forceLookY, maxDistance])

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}

type CharPos = { faceX: number; faceY: number; bodySkew: number }
const DEFAULT_POS: CharPos = { faceX: 0, faceY: 0, bodySkew: 0 }

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)
  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)

  const [allPositions, setAllPositions] = useState({
    purple: DEFAULT_POS,
    black: DEFAULT_POS,
    yellow: DEFAULT_POS,
    orange: DEFAULT_POS,
  })
  const { purple: purplePos, black: blackPos, yellow: yellowPos, orange: orangePos } = allPositions

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const computePosition = (ref: React.RefObject<HTMLDivElement | null>): CharPos => {
      if (!ref.current) return DEFAULT_POS
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 3
      const deltaX = mouse.x - centerX
      const deltaY = mouse.y - centerY
      return {
        faceX: Math.max(-15, Math.min(15, deltaX / 20)),
        faceY: Math.max(-10, Math.min(10, deltaY / 30)),
        bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
      }
    }

    setAllPositions({
      purple: computePosition(purpleRef),
      black: computePosition(blackRef),
      yellow: computePosition(yellowRef),
      orange: computePosition(orangeRef),
    })
  }, [mouse])

  useEffect(() => {
    let active = true
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000
    const scheduleBlink = () => {
      const t = setTimeout(() => {
        if (!active) return
        setIsPurpleBlinking(true)
        setTimeout(() => {
          if (!active) return
          setIsPurpleBlinking(false)
          scheduleBlink()
        }, 150)
      }, getRandomBlinkInterval())
      return t
    }
    const timeout = scheduleBlink()
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    let active = true
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000
    const scheduleBlink = () => {
      const t = setTimeout(() => {
        if (!active) return
        setIsBlackBlinking(true)
        setTimeout(() => {
          if (!active) return
          setIsBlackBlinking(false)
          scheduleBlink()
        }, 150)
      }, getRandomBlinkInterval())
      return t
    }
    const timeout = scheduleBlink()
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (!isTyping) return
    const timer1 = setTimeout(() => setIsLookingAtEachOther(true), 0)
    const timer2 = setTimeout(() => setIsLookingAtEachOther(false), 800)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isTyping])

  useEffect(() => {
    if (!(password.length > 0 && showPassword)) return
    let active = true
    const schedulePeek = () => {
      const t = setTimeout(() => {
        if (!active) return
        setIsPurplePeeking(true)
        setTimeout(() => {
          if (!active) return
          setIsPurplePeeking(false)
        }, 800)
      }, Math.random() * 3000 + 2000)
      return t
    }
    const firstPeek = schedulePeek()
    return () => {
      active = false
      clearTimeout(firstPeek)
    }
  }, [password, showPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setError('Login is not connected yet — this is a design preview.')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--color-void)]">
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[var(--color-emerald)]/90 via-[var(--color-emerald)] to-[var(--color-emerald)]/70 p-12">
        <div className="relative z-20">
          <span className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            RAKIZ
          </span>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            <div
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px',
                width: '180px',
                height: isTyping || (password.length > 0 && !showPassword) ? '440px' : '400px',
                backgroundColor: 'var(--color-bullion)',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform:
                  password.length > 0 && showPassword
                    ? 'skewX(0deg)'
                    : isTyping || (password.length > 0 && !showPassword)
                      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                      : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: password.length > 0 && showPassword ? '20px' : isLookingAtEachOther ? '55px' : `${45 + purplePos.faceX}px`,
                  top: password.length > 0 && showPassword ? '35px' : isLookingAtEachOther ? '65px' : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#1a1a1a"
                  isBlinking={isPurpleBlinking}
                  mouseX={mouse.x}
                  mouseY={mouse.y}
                  forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#1a1a1a"
                  isBlinking={isPurpleBlinking}
                  mouseX={mouse.x}
                  mouseY={mouse.y}
                  forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            <div
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform:
                  password.length > 0 && showPassword
                    ? 'skewX(0deg)'
                    : isLookingAtEachOther
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                      : isTyping || (password.length > 0 && !showPassword)
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                        : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: password.length > 0 && showPassword ? '10px' : isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`,
                  top: password.length > 0 && showPassword ? '28px' : isLookingAtEachOther ? '12px' : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#1a1a1a"
                  isBlinking={isBlackBlinking}
                  mouseX={mouse.x}
                  mouseY={mouse.y}
                  forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#1a1a1a"
                  isBlinking={isBlackBlinking}
                  mouseX={mouse.x}
                  mouseY={mouse.y}
                  forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            <div
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: 'var(--color-bone)',
                borderRadius: '120px 120px 0 0',
                transform: password.length > 0 && showPassword ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: password.length > 0 && showPassword ? '50px' : `${82 + (orangePos.faceX || 0)}px`,
                  top: password.length > 0 && showPassword ? '85px' : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
              </div>
            </div>

            <div
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: 'var(--color-bullion-bright)',
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: password.length > 0 && showPassword ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: password.length > 0 && showPassword ? '20px' : `${52 + (yellowPos.faceX || 0)}px`,
                  top: password.length > 0 && showPassword ? '35px' : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a" mouseX={mouse.x} mouseY={mouse.y} forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
              </div>
              <div
                className="absolute w-20 h-[4px] bg-[#1a1a1a] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: password.length > 0 && showPassword ? '10px' : `${40 + (yellowPos.faceX || 0)}px`,
                  top: password.length > 0 && showPassword ? '88px' : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-white/60">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-[var(--color-void)]">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12 text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
            RAKIZ
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
              Welcome back!
            </h1>
            <p className="text-[var(--color-bone-dim)] text-sm">Please enter your details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[var(--color-bone)]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[var(--color-bone)]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-[var(--color-bone-dim)]">
                  Remember for 30 days
                </Label>
              </div>
              <a href="#" className="text-sm text-[var(--color-emerald-bright)] hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-medium" size="lg" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Log in'}
            </Button>
          </form>

          <div className="mt-6">
            <Button variant="outline" className="w-full h-12" type="button">
              <Mail className="mr-2 size-5" />
              Log in with Google
            </Button>
          </div>

          <div className="text-center text-sm text-[var(--color-bone-dim)] mt-8">
            Don't have an account?{' '}
            <a href="/register" className="text-[var(--color-bone)] font-medium hover:underline">Sign Up</a>
          </div>
        </div>
      </div>
    </div>
  )
}