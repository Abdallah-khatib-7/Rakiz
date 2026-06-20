import { useState, useEffect } from 'react'
import { LogIn, UserPlus, Play, Menu, X } from 'lucide-react'
import BoomerangVideoBg from './BoomerangVideoBg'

const BG_VIDEO = 'https://rakiz-uploads.s3.us-east-1.amazonaws.com/videos/856668-hd_1280_720_30fps.mp4'

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const navLinks = [
    { href: '#wallet', label: 'Wallet' },
    { href: '#how', label: 'How it works' },
    { href: '#pricing', label: 'Pricing' },
  ]

  return (
    <section className="relative w-full min-h-screen sm:h-screen overflow-hidden bg-[#0A0E0F]">
      <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 w-full h-full" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85" />

      <nav className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6">
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            RAKIZ
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full pl-6 pr-1 py-1 border border-white/15">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm px-3 py-2 font-medium text-white/80 hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
          <a href="/register" className="ml-2 bg-[#00D27A] hover:bg-[#00B86A] text-[#0A0E0F] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
            Get started
          </a>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 text-white">
          <a href="/register" className="hidden sm:flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity">
            <UserPlus className="w-4 h-4" />
            Sign up
          </a>
          <a href="/login" className="hidden sm:flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity">
            <LogIn className="w-4 h-4" />
            Log in
          </a>
          <button onClick={() => setMenuOpen((v) => !v)} className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white transition-all duration-300" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            <Menu className={'w-5 h-5 absolute transition-all duration-300 ' + (menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100')} />
            <X className={'w-5 h-5 absolute transition-all duration-300 ' + (menuOpen ? 'opacity-100' : 'opacity-0 -rotate-90 scale-50')} />
          </button>
        </div>
      </nav>

      <div onClick={() => setMenuOpen(false)} className={'lg:hidden fixed inset-0 z-20 transition-opacity duration-300 ' + (menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      <div className={'lg:hidden fixed top-0 right-0 bottom-0 z-20 w-[85%] max-w-sm bg-[#0A0E0F]/98 backdrop-blur-xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ' + (menuOpen ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex flex-col h-full pt-24 px-8 pb-8">
          {navLinks.map((link, i) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={'text-2xl font-semibold text-white py-4 border-b border-white/10 transition-all duration-500 ' + (menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0')} style={{ transitionDelay: menuOpen ? (150 + i * 70) + 'ms' : '0ms' }}>
              {link.label}
            </a>
          ))}
          <a href="/register" className={'mt-8 bg-[#00D27A] text-[#0A0E0F] text-sm font-semibold px-5 py-3 rounded-full text-center transition-all duration-500 ' + (menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0')} style={{ transitionDelay: menuOpen ? '400ms' : '0ms' }}>
            Get started
          </a>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-start text-left pt-32 sm:pt-36 md:pt-40 px-6 sm:px-10 md:px-16 max-w-3xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D27A] animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#00D27A]">
            Built on trust
          </span>
        </div>
        <h1 className="font-bold leading-[0.92] text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl" style={{ fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '-0.03em' }}>
          Money moves.
          <br />
          <span className="text-[#00D27A]">Instantly.</span>
        </h1>
        <p className="mt-6 text-white/70 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg">
          One wallet. Six currencies. Every payment, settled before you've finished typing.
        </p>
      </div>

      <div className="absolute left-6 sm:left-10 md:left-16 bottom-8 sm:bottom-10 md:bottom-12 z-10 max-w-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <a href="/register" className="bg-[#00D27A] hover:bg-[#00B86A] text-[#0A0E0F] text-sm font-semibold px-6 py-3 rounded-full transition-colors">
            Create your account
          </a>
          <a href="/login" className="text-white text-sm font-medium hover:opacity-80 transition-opacity">
            Sign in to your account
          </a>
        </div>
      </div>

      <div className="hidden sm:flex absolute right-6 md:right-16 bottom-10 md:bottom-12 z-10 items-center gap-2 text-white/80 text-sm">
        <button className="flex items-center justify-center w-6 h-6 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors">
          <Play className="w-3 h-3 fill-white text-white ml-0.5" />
        </button>
        <span className="font-medium">How Rakiz works</span>
      </div>
    </section>
  )
}
