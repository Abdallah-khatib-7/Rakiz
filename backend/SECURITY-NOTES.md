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