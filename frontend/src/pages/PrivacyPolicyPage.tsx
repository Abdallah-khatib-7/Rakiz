export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-void)] px-6 sm:px-10 md:px-16 py-16">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-sm text-[var(--color-emerald-bright)] hover:underline font-medium mb-8 inline-block">
          ← Back to Rakiz
        </a>

        <p className="font-mono text-xs tracking-[0.25em] uppercase text-[var(--color-bullion)] mb-4">
          Legal
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold text-[var(--color-bone)] mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Privacy Policy
        </h1>

        <div className="space-y-8 text-[var(--color-bone-dim)] text-base leading-relaxed">
          <p className="text-[var(--color-bone)]">Last updated: June 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              What we collect
            </h2>
            <p>
              We collect the information you give us directly: your name, email address, and optionally a phone
              number, when you create an account. When you use Rakiz to send, receive, split, or request money, we
              record the details of those transactions — amounts, currencies, timestamps, and who was involved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              How we use it
            </h2>
            <p>
              Your information is used to operate your account, process transactions, detect fraud, and communicate
              with you about your account — verification emails, security alerts, and notifications about activity
              on your account. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Security
            </h2>
            <p>
              Sensitive data, including IP addresses tied to your sessions, is encrypted at rest. Passwords are
              hashed and never stored in plain text. All financial transactions are recorded using a double-entry
              ledger system to ensure accuracy and auditability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Your rights
            </h2>
            <p>
              You can request a copy of your data, ask us to correct inaccurate information, or request deletion of
              your account by contacting us. Some information may be retained as required by financial recordkeeping
              obligations even after account closure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Contact
            </h2>
            <p>
              Questions about this policy can be sent to{' '}
              <a href="mailto:privacy@rakiz.uk" className="text-[var(--color-emerald-bright)] hover:underline">
                privacy@rakiz.uk
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}