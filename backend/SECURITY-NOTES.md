# Security Notes

## RESOLVED: ws DoS advisory (CVE-2026-48779 / GHSA-96hv-2xvq-fx4p)
- Was pending since Phase 5 — fix (ws 8.21.0) wasn't published yet at the time.
- Resolved 2026-06-18 via `npm audit fix` once ws 8.21.0 became available.
  socket.io-adapter and engine.io updated alongside it. No breaking changes,
  socket.io itself stayed at 4.8.3. `npm audit` now reports 0 vulnerabilities.



## Pending: MongoDB Atlas open IP allowlist (0.0.0.0/0)
- Added during local development for convenience (dynamic IP issues).
- Action required: Before production deploy (Phase 10), remove 0.0.0.0/0
  from Network Access in Atlas and replace with the actual EC2 instance IP
  or VPC peering.
- Risk during development: Low — database still requires valid credentials,
  but anyone with the connection string could attempt to connect.


  ## Scaling & performance hardening (scheduled for Phase 9.5 / Phase 10)
- [ ] Wallet balance caching in Redis, with airtight invalidation on every
      write inside ledger.service.js transfer(). Stale balance reads are a
      real correctness bug in a financial app, not just a performance nit.
- [ ] Socket.io Redis adapter — required once running 2+ server instances
      behind a load balancer, so emits reach users connected to a different
      instance than the one that fired the event. Not needed for single
      instance (current state).
- [ ] Rate limiter Redis backing — currently in-memory (per rateLimiter.js
      comment), only correct for a single instance. Same trigger as above.
- [ ] Load testing (autocannon or k6) against realistic concurrent traffic
      to find actual bottlenecks instead of guessing. Should happen before
      tuning connection pools, indexes, or cache TTLs further.
- [ ] Database index audit based on real slow-query logs once load testing
      reveals what's actually slow.


## Deliberately deferred: SMS-verified phone number sending
- Backend support exists: users table has an optional `phone` column,
  registration accepts it, and wallet.service.js's send() can already look
  up a recipient by phone OR email (receiver_identifier field).
- NOT exposed as a trusted send method yet, because phone numbers are
  currently unverified — anyone could type any digits at registration with
  no proof they control that number. Sending money to an unverified phone
  number would be a real trust gap, the same category of risk we've avoided
  everywhere else in this build.
- Real fix is SMS OTP verification (Twilio Verify or similar), same pattern
  as our existing email verification flow. Researched and scoped:
  - Twilio free trial only allows messaging pre-approved numbers — cannot
    serve arbitrary new users, so it doesn't solve the actual problem.
  - Real usage costs ~$0.05/verification via Twilio Verify, or ~$0.008/SMS
    sending it manually — genuine per-user cost, no viable free tier.
  - This is a known, scoped, deliberate deferral, not an oversight. The
    OTP flow itself (generate code, expire after N minutes, rate-limit
    attempts, confirm-then-mark-verified) is the same shape as
    auth.service.js's existing email verification, just swapping the
    delivery channel and adding cost-awareness to the rate limiting.
- To ship this later: add Twilio account + Verify service, a
  `phone_verified` boolean column, a verify-phone endpoint, and gate
  send-by-phone in wallet.service.js behind that flag.


  ## Currency exchange: fixed rates for SAR, AED, LBP
- Frankfurter (our live FX data source) doesn't carry SAR, AED, or LBP at
  all — confirmed via their public currency list. Exchanging into/out of
  these three would otherwise fail with "no rate available."
- SAR and AED are genuine, government-fixed pegs to USD (3.75 and 3.6725
  respectively, set by their central banks since the 1980s/70s) — hardcoding
  these is accurate, not an approximation, and they will not drift.
- LBP is fundamentally different and intentionally flagged as such in code
  comments (exchange.service.js): it floats on a volatile market with no
  official peg since Lebanon's currency crisis. 89,000 LBP/USD is a real
  snapshot rate as of June 2026, but WILL go stale as the real rate moves.
  This is a deliberate "good enough for demo/portfolio" choice — a real
  production deployment would need either a live LBP-supporting FX feed or
  a manual update process to keep the rate current.


  ## Local dev reminder: Stripe webhook listener
- Testing real Stripe checkout locally REQUIRES `stripe listen --forward-to
  localhost:5000/api/subscriptions/webhook` running in its own terminal
  the entire time you're testing — Stripe can't reach localhost otherwise.
- Each time the listener restarts, it generates a NEW whsec_ signing secret.
  Update STRIPE_WEBHOOK_SECRET in backend/.env to match, or webhook signature
  verification silently fails and subscription_tier never updates.
- This is dev-only. In Phase 10 production, Stripe calls our real public
  webhook URL directly — no CLI tunnel needed there.