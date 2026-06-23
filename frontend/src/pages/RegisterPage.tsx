import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import { CharacterScene } from '@/components/CharacterScene'
import { useCharacterAnimation } from '@/hooks/useCharacterAnimation'
import { apiRegister } from '@/lib/api'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [registered, setRegistered] = useState(false)

  const anim = useCharacterAnimation(password, showPassword, isTyping)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await apiRegister(email, password, fullName)
      setRegistered(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--color-void)]">
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[var(--color-emerald)]/90 via-[var(--color-emerald)] to-[var(--color-emerald)]/70 p-12">
        <div className="relative z-20 flex items-center gap-4">
          <a
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex items-center justify-center size-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
          </a>
          <span className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>RAKIZ</span>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <CharacterScene
            purpleRef={anim.purpleRef}
            blackRef={anim.blackRef}
            yellowRef={anim.yellowRef}
            orangeRef={anim.orangeRef}
            purplePos={anim.purplePos}
            blackPos={anim.blackPos}
            yellowPos={anim.yellowPos}
            orangePos={anim.orangePos}
            mouse={anim.mouse}
            isTyping={isTyping}
            isLookingAtEachOther={anim.isLookingAtEachOther}
            isPurpleBlinking={anim.isPurpleBlinking}
            isBlackBlinking={anim.isBlackBlinking}
            isPurplePeeking={anim.isPurplePeeking}
            password={password}
            showPassword={showPassword}
          />
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-white/60">
          <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
<a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
<a href="/contact" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-[var(--color-void)]">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12 text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>RAKIZ</div>

          {registered ? (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--color-emerald)]/15 flex items-center justify-center">
                  <CheckCircle2 className="size-8 text-[var(--color-emerald-bright)]" />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3 text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>
                Check your email
              </h1>
              <p className="text-[var(--color-bone-dim)] text-sm leading-relaxed mb-8">
                We sent a verification link to <span className="text-[var(--color-bone)] font-medium">{email}</span>.
                Click it to activate your account, then come back and sign in.
              </p>
              <a href="/login" className="text-sm text-[var(--color-emerald-bright)] hover:underline font-medium">
                Back to sign in
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--color-bone)]" style={{ fontFamily: 'var(--font-display)' }}>Create an account</h1>
                <p className="text-[var(--color-bone-dim)] text-sm">Start sending money instantly</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-[var(--color-bone)]">Full Name</Label>
                  <Input id="fullName" type="text" placeholder="Your name" value={fullName} autoComplete="off" onChange={(e) => setFullName(e.target.value)} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} required className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-[var(--color-bone)]">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} autoComplete="off" onChange={(e) => setEmail(e.target.value)} onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)} required className="h-12" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-[var(--color-bone)]">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="h-12 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition-colors">
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                {error && <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg">{error}</div>}

                <Button type="submit" className="w-full h-12 text-base font-medium" size="lg" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <div className="mt-6">
                <Button variant="outline" className="w-full h-12" type="button" onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google` }}>
                  <Mail className="mr-2 size-5" />
                  Sign up with Google
                </Button>
              </div>

              <div className="text-center text-sm text-[var(--color-bone-dim)] mt-8">
                Already have an account?{' '}
                <a href="/login" className="text-[var(--color-bone)] font-medium hover:underline">Sign in</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}