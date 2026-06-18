# Security Notes

## Pending: ws DoS advisory (CVE-2026-48779 / GHSA-96hv-2xvq-fx4p)
- Severity: High (Denial of Service)
- Affected: ws 8.0.0 - 8.20.1 (transitive dependency via socket.io 4.8.3)
- Fix: ws 8.21.0 — NOT YET PUBLISHED to npm as of 2026-06-16
- Action required: Before production deploy (Phase 10), run `npm update ws`
  and `npm audit` to confirm 8.21.0+ is installed and the advisory clears.
- Risk during development: None (localhost only, no external attackers).
- DO NOT run `npm audit fix --force` — it downgrades socket.io to 4.5.4 (worse).


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