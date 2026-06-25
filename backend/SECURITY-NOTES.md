# Security Notes

## RESOLVED: ws DoS advisory (CVE-2026-48779 / GHSA-96hv-2xvq-fx4p)
- Was pending since Phase 5 — fix (ws 8.21.0) wasn't published yet at the time.
- Resolved 2026-06-18 via `npm audit fix` once ws 8.21.0 became available.
  socket.io-adapter and engine.io updated alongside it. No breaking changes,
  socket.io itself stayed at 4.8.3. `npm audit` now reports 0 vulnerabilities.


## RESOLVED: nodemailer message-level raw option bypass (GHSA-p6gq-j5cr-w38f)
- Resolved via `npm audit fix`. Not actively exploitable in our code either
  way — mailer.js and email.service.js only ever use the standard templated
  send (to/subject/html), never the `raw` option this advisory concerns.
  Fixed anyway since a clean fix was available at no cost.


## RESOLVED: MongoDB Atlas open IP allowlist (0.0.0.0/0)
- Added during local development for convenience (dynamic home IP).
- Removed 2026-06-24. Replaced with specific /32 entries for the
  developer's actual current IP.
- Real complication discovered while fixing this: the home network's IP
  rotates frequently (185.97.95.176 -> 185.97.94.153 within ~10 minutes),
  same ISP block but different address each time. This caused several
  confusing "still can't connect" moments that looked like an Atlas bug
  but were actually just an IP that changed faster than expected.
- Two older stale entries (178.135.15.59/32, 178.135.19.53/32) are still
  present from earlier in the project — safe to delete, just hygiene, not
  urgent. Not currently in use as of this writing.
- UPDATE 2026-06-25: EC2's Elastic IP (98.95.101.217) added to the
  allowlist as part of Phase 10 deployment — this is now the permanent
  entry that matters for production.


## Scaling & performance hardening (deferred until real load exists)
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
- These remain genuinely deferred post-deployment — the app is live with a
  single backend instance and no real concurrent load yet, so building
  multi-instance infrastructure now would be premature optimization.


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
  - This is a known, scoped, deliberate deferral, not an oversight.
- To ship this later: add Twilio account + Verify service, a
  `phone_verified` boolean column, a verify-phone endpoint, and gate
  send-by-phone in wallet.service.js behind that flag.


## Currency exchange: fixed rates for SAR, AED, LBP
- Frankfurter (our live FX data source) doesn't carry SAR, AED, or LBP at
  all — confirmed via their public currency list.
- SAR and AED are genuine, government-fixed pegs to USD (3.75 and 3.6725
  respectively) — hardcoding these is accurate, not an approximation.
- LBP is fundamentally different: it floats on a volatile market with no
  official peg since Lebanon's currency crisis. 89,000 LBP/USD is a real
  snapshot rate as of June 2026, but WILL go stale as the real rate moves.
  A real production deployment would need a live LBP-supporting FX feed or
  a manual update process to keep the rate current — not yet built.


## Local dev reminder: Stripe webhook listener
- Testing real Stripe checkout locally REQUIRES `stripe listen --forward-to
  localhost:5000/api/subscriptions/webhook` running in its own terminal
  the entire time you're testing.
- Each restart of the listener generates a NEW whsec_ signing secret that
  must be copied into STRIPE_WEBHOOK_SECRET in backend/.env, or signature
  verification silently fails.
- Production no longer needs this — see the completed deployment log below.


## Phase 10 production deployment — COMPLETED 2026-06-25

**Live:** Frontend at `https://rakiz-mocha.vercel.app`, backend at
`https://api.rakiz.uk`. Fully tested end to end, including a real
registration, login, and admin-balance-adjustment flow against production.

- [x] EC2 Elastic IP allocated and associated (98.95.101.217) — permanent,
      survives instance stop/start.
- [x] DNS: api.rakiz.uk -> 98.95.101.217 (Cloudflare, proxy off / DNS only).
- [x] MySQL installed directly on the EC2 instance, schema loaded,
      dedicated rakiz_app user created (not using root).
- [x] Backend containerized via Docker, network_mode: host (since MySQL
      runs natively on the same box, not in a separate container).
- [x] nginx reverse proxy + real SSL via Certbot — https://api.rakiz.uk
      fully live with a trusted certificate, HTTP auto-redirects to HTTPS.
- [x] Port 5000 closed at the security group level — only reachable via
      nginx on 443 now, not directly. Confirmed via external curl timeout.
- [x] GOOGLE_CALLBACK_URL updated to the production domain; added as an
      additional authorized redirect URI in Google Cloud Console
      (localhost one kept too, for continued local dev).
- [x] Real Stripe webhook registered in the Dashboard against
      https://api.rakiz.uk/api/subscriptions/webhook, with a permanent
      whsec_ secret — STRIPE_WEBHOOK_SECRET updated in production .env.
- [x] Frontend deployed to Vercel (rakiz-mocha.vercel.app), auto-deploys
      from main. VITE_API_URL set to https://api.rakiz.uk.
- [x] FRONTEND_URL updated on the backend to the real Vercel URL; this
      same value feeds app.js's CORS allowlist, so no separate CORS code
      change was needed.
- [x] S3 bucket CORS policy updated to allow the production Vercel origin
      (was previously localhost-only, which broke the hero video on the
      live site until fixed).
- [x] Vercel SPA routing fixed via a vercel.json rewrite rule — without
      it, directly loading or refreshing any client-side route (e.g.
      /register) 404'd at Vercel's edge before React Router could handle
      it.
- [x] First admin account granted manually via a direct database UPDATE
      over SSH (`UPDATE users SET role = 'admin' WHERE id = ...`) — there
      is intentionally no in-app self-promotion path, so this one-time
      manual step is correct, not a workaround.
- [ ] Resend domain send-test from production — verification emails were
      not separately re-tested against the live production registration
      flow as a dedicated step; worth a deliberate confirmation, though
      no reason to expect it behaves differently than local dev since the
      domain and API key are unchanged.

### Real incident during this deployment: SSH outage
Installing nginx + certbot left ssh.service unlinked from
multi-user.target.wants/ (the unit file stayed intact, just not enabled
for boot) — SSH became completely unreachable, confirmed even from AWS's
own internal network via CloudShell, ruling out any security-group/client
issue. Status checks (system/instance/EBS) all passed, so the VM itself
was healthy throughout; only sshd was affected.

Recovered via the standard AWS EBS-detach procedure: stopped the instance,
detached the root volume, attached it as a secondary disk to a temporary
helper instance in the same AZ, mounted it, chrooted in, ran
`systemctl enable ssh`, cleanly unmounted, reattached the volume to the
original instance as /dev/sda1, restarted it. Docker's
`restart: unless-stopped` policy brought rakiz-api back up automatically
once the instance was running again — no data or container state was lost
at any point in this process.

### MySQL: EC2-local vs. managed, decision and tradeoff
Chose to install MySQL directly on the EC2 instance rather than set up a
new managed provider (e.g. Aiven, mentioned as an option in the original
brief) — avoided adding yet another new account/service during an already
service-heavy build (MongoDB, Redis, Stripe, Resend, Cloudflare). Real,
acknowledged tradeoff: the database's durability is now tied to this one
EC2 instance's EBS volume, with no automated backup strategy in place.
Migrating to a managed MySQL later remains straightforward since the
schema itself doesn't change — this was a pragmatic "ship it" choice, not
a permanent architectural decision.

### Granting the first admin account
There is intentionally no API endpoint or UI path for a user to grant
themselves (or anyone else) the admin role — that would be a serious
privilege-escalation hole. The first admin account on the live production
database was set via a direct SQL UPDATE, run manually over SSH, once.
Any future admin accounts should be granted by an existing admin through
proper account review, not by repeating this manual step casually.