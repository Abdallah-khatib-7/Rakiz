export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>

        <div className="space-y-8 text-[var(--color-bone-dim)] text-base leading-relaxed">
          <p className="text-[var(--color-bone)]">Last updated: June 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Using Rakiz
            </h2>
            <p>
              By creating an account, you agree to use Rakiz only for lawful purposes. You're responsible for
              keeping your login credentials secure and for all activity that happens under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Transactions
            </h2>
            <p>
              Transfers between Rakiz accounts are intended to be final once completed. We monitor for unusual
              activity and may flag, delay, or reverse transactions that appear fraudulent. Rakiz is not a bank and
              does not offer deposit insurance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Account status
            </h2>
            <p>
              We may suspend or restrict accounts that violate these terms, show signs of fraudulent activity, or
              pose a risk to other users. We'll make reasonable efforts to notify you if this happens to your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Limitation of liability
            </h2>
            <p>
              Rakiz is provided as-is. We work to keep the platform secure and available, but we don't guarantee
              uninterrupted service and aren't liable for losses arising from circumstances outside our reasonable
              control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of Rakiz after a change means you accept
              the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--color-bone)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Contact
            </h2>
            <p>
              Questions about these terms can be sent to{' '}
              <a href="mailto:legal@rakiz.uk" className="text-[var(--color-emerald-bright)] hover:underline">
                legal@rakiz.uk
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}