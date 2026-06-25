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
- For Phase 10: add the EC2 instance's IP as a permanent allowlist entry.
  EC2 IPs are static (or made static via an Elastic IP, which we should
  provision specifically so this IP never has to change), so this won't
  have the rotation problem the developer's home connection does.
- Confirmed this allowlist only gates backend-to-database access — it has
  no effect on end users. Any user, from any network, connects through the
  backend server normally; only the backend's own IP needs to be allowed
  through to MongoDB.
- UPDATE 2026-06-25: EC2's Elastic IP (98.95.101.217) added to the
  allowlist as part of Phase 10 deployment. See completed checklist below.


## Scaling & performance hardening (scheduled for Phase 10)
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
  webhook URL directly (registered in the Stripe Dashboard against the real
  domain) — no CLI tunnel needed there, and no manually-copied whsec_ value
  either, since the Dashboard generates a stable one for that endpoint.


## Phase 10 production deployment — COMPLETED 2026-06-25
- [x] EC2 Elastic IP allocated and associated (98.95.101.217) — permanent,
      survives instance stop/start.
- [x] DNS: api.rakiz.uk -> 98.95.101.217 (Cloudflare, proxy off / DNS only).
- [x] MySQL installed directly on the EC2 instance (decided against a
      managed provider for now — see reasoning below), schema loaded,
      dedicated rakiz_app user created (not using root).
- [x] Backend containerized via Docker, network_mode: host (since MySQL
      runs natively on the same box, not in a separate container).
- [x] nginx reverse proxy + real SSL via Certbot — https://api.rakiz.uk
      fully live with a trusted certificate, HTTP auto-redirects to HTTPS.
- [x] Port 5000 closed at the security group level — only reachable via
      nginx on 443 now, not directly.
- [x] GOOGLE_CALLBACK_URL updated to the production domain; added as an
      additional authorized redirect URI in Google Cloud Console
      (localhost one kept too, for continued local dev).
- [x] Real Stripe webhook registered in the Dashboard against
      https://api.rakiz.uk/api/subscriptions/webhook, with a permanent
      whsec_ secret (not a CLI-generated one) — STRIPE_WEBHOOK_SECRET
      updated in production .env.
- [ ] Frontend deploy to Vercel — in progress.
- [ ] FRONTEND_URL on the backend still needs updating once the real
      Vercel URL exists (currently a placeholder).
- [ ] CORS allowed origins in app.js need the real Vercel domain added.
- [ ] Resend domain send-test from production — not yet verified.

### Real incident during this deployment: SSH outage
Installing nginx + certbot somehow left ssh.service unlinked from
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
EC2 instance's EBS volume. No automated backup strategy is in place yet.
Migrating to a managed MySQL later remains straightforward since the
schema itself doesn't change — this was a pragmatic "ship it" choice, not
a permanent architectural decision.