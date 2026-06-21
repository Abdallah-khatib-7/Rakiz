import { useState } from 'react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[var(--color-void)] px-6 sm:px-10 md:px-16 py-16">
      <div className="max-w-xl mx-auto">
        <a href="/" className="text-sm text-[var(--color-emerald-bright)] hover:underline font-medium mb-8 inline-block">
          ← Back to Rakiz
        </a>

        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-4">
          Get in touch
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold text-[var(--color-bone)] mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Contact us
        </h1>
        <p className="text-[var(--color-bone-dim)] text-base leading-relaxed mb-10">
          Questions, feedback, or something not working as expected — we'd like to hear about it.
        </p>

        {submitted ? (
          <div className="py-8">
            <p className="text-[var(--color-emerald-bright)] text-lg font-semibold mb-2">Message sent.</p>
            <p className="text-[var(--color-bone-dim)] text-sm">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-[var(--color-bone-dim)] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full bg-transparent border-b border-[var(--color-line)] pb-3 text-lg text-[var(--color-bone)] outline-none focus:border-[var(--color-emerald-bright)] transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-[var(--color-bone-dim)] mb-2">
                Message
              </label>
              <textarea
                required
                rows={5}
                className="w-full bg-transparent border-b border-[var(--color-line)] pb-3 text-lg text-[var(--color-bone)] outline-none focus:border-[var(--color-emerald-bright)] transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="px-7 py-3 rounded-full bg-[var(--color-emerald-bright)] text-[var(--color-void)] text-sm font-semibold transition-transform hover:scale-105"
            >
              Send message
            </button>
          </form>
        )}

        <p className="text-[var(--color-bone-dim)] text-sm mt-10">
          Or email us directly at{' '}
          <a href="mailto:hello@rakiz.uk" className="text-[var(--color-emerald-bright)] hover:underline">
            hello@rakiz.uk
          </a>
        </p>
      </div>
    </div>
  )
}