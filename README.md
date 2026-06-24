# Rakiz (ركيزة)

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-S3+EC2-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)
![License](https://img.shields.io/badge/License-Portfolio-orange?style=for-the-badge)

*Rakiz* — Arabic for "pillar" or "foundation." A multi-currency digital wallet and real-time payment splitting platform, built with bank-grade engineering discipline from the ground up: double-entry bookkeeping, row-level locking, idempotent transfers, encrypted PII, and an AI-assisted fraud queue — not bolted on after the fact, but designed in from the schema up.

Multi-currency wallets · Instant transfers · Bill splitting · Payment requests · Shareable payment links · AI financial insights · Stripe subscriptions · Admin fraud review

Built by **Abdallah Khatib** — Computer Science graduate, Lebanese International University, and the developer behind PharmaCare, Tawla, and AceIt.

---

## About

Rakiz exists to answer a simple question properly: what does it actually take to move money between people correctly? Not "looks right in a demo," but correctly — every debit has a matching credit, every transfer is provably idempotent, every balance read reflects a row-locked, committed state, and every account action leaves an audit trail.

It was built phase by phase, backend first: the ledger and double-entry bookkeeping before any UI existed to display a balance; authentication, session rotation, and fraud rules before a single dollar moved; then a full custom frontend — landing page, every authenticated page, real-time notifications, an AI insights layer, and an admin panel — wired against that backend rather than mocked against assumptions about it.

---

## ✨ Key Features

### 💰 Multi-Currency Wallets
- Hold balances in six currencies: **USD, EUR, LBP, SAR, AED, GBP**
- Wallets are created lazily on first use, or explicitly on demand from the Wallet page
- Every amount stored as `DECIMAL(18,8)` — never a float — across every financial table
- Exchange between your own wallets at real (Frankfurter.app) or fixed rates (SAR/AED government pegs, a documented LBP snapshot rate)

### ⚡ Instant Transfers
- Send to any user by email **or** phone number — one field, auto-detected
- Cross-currency sends convert automatically at the live or fixed rate
- Every send requires a client-generated idempotency key, checked in Redis before any database write — a retried request can never double-execute
- Free tier capped at 20 sends/month and 5 splits/month, enforced server-side, not just hidden in the UI

### 🤝 Bill Splitting
- Three split types: **equal**, **custom amount**, **percentage**
- Live settlement progress bar showing exactly how much of the total has actually been paid
- The split creator settling their own share is detected and skipped as a real transfer (no meaningless self-payment ledger entry) — still marks their share settled correctly

### 📨 Payment Requests
- Request money from anyone by email, with an optional note and expiry
- Recipient can pay, decline, or the requester can cancel
- Separate "sent" / "received" views

### 🔗 Payment Links
- Fixed-amount or open-amount, single-use or reusable, optional expiry
- Public pay page (`/pay/:token`) — anyone can view what a link is for without an account; paying it requires sign-in
- One-tap copy-to-clipboard with animated confirmation

### 🧠 AI Financial Insights
- On-demand monthly spending summary: total sent/received, top categories, plain-language summary
- Savings suggestions generated from real transaction data
- Anomaly detection that flags unusual activity within a given month
- Natural-language transaction search ("find my transactions with Sara last month") — the model is given a bounded window of the user's *own* transactions and asked to match against it; it never touches the database directly

### 🔐 Security & Account Control
- Refresh token rotation with family tracking — reusing a revoked token kills every session in that family, not just the one
- Device fingerprinting bound to every session
- Active session list with per-session and "sign out everywhere" revocation
- AES-256-GCM encryption at rest for stored IP addresses
- Inline profile editing (name, phone), password change (which revokes all other sessions), avatar upload to S3
- Suspicious new-IP login detection with an automatic email alert

### 💳 Subscriptions (Stripe)
- Free / Pro ($9.99/mo) / Business ($29.99/mo) tiers
- Real Stripe Checkout for upgrades, real Stripe Billing Portal for managing or cancelling
- Webhook-driven tier sync — `subscription_tier` only ever changes in response to a verified Stripe event

### 🛡️ Admin Panel
- User search, freeze/suspend/reactivate, manual balance adjustment with a required reason (fully audit-logged)
- Revenue overview: user counts per tier, total transactions, fees collected, 30-day activity
- Fraud queue with filterable status (open/reviewing/resolved/dismissed) — clicking a flag triggers a real-time AI analysis: the actual linked transaction, the user's recent send history, a grounded plain-language explanation of why it was flagged, and a concrete recommendation, generated fresh per incident rather than a static rule description

### 🔔 Real-Time Notifications
- Socket.io connection authenticated via JWT handshake, established once per session
- Live unread badge on the bell icon, updates instantly on `notification:new` — no polling, no refresh needed
- Mark-as-read / mark-all-read, with the badge count kept in sync via shared context

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 5.2 | REST API server |
| MySQL (mysql2) | 8.0 / 3.22 | Primary relational store — wallets, ledger, users, splits, etc. |
| Mongoose (MongoDB) | 9.7 | Audit event log, AI-generated monthly insights |
| ioredis / redis | 5.11 / 6.0 | Idempotency keys, rate limiting, login lockout counters, velocity checks |
| Socket.io | 4.8 | Real-time notifications, fraud alerts, balance/split updates |
| jsonwebtoken | 9.0 | Access + refresh token signing and verification |
| bcrypt | 6.0 | Password hashing (cost factor 12) |
| zxcvbn | 4.4 | Password strength scoring |
| Passport + passport-google-oauth20 | 0.7 / 2.0 | Google OAuth 2.0 |
| Joi | 18.2 | Request validation on every route |
| Helmet | 8.2 | Security HTTP headers |
| express-rate-limit | 8.5 | Layered rate limiting (global, per-user, per-endpoint, login lockout) |
| cors | 2.8 | CORS allowlist restricted to the frontend origin |
| cookie-parser | 1.4 | httpOnly refresh token cookie handling |
| crypto-js | 4.2 | AES-256-GCM encryption helpers |
| @aws-sdk/client-s3 + s3-request-presigner | 3.1073 | Avatar upload/delete, presigned URL generation |
| multer | 2.2 | In-memory multipart upload handling (avatars) |
| stripe | 22.2 | Checkout Sessions, Billing Portal, webhook verification |
| openai | 6.44 | AI insights, anomaly detection, NL search, fraud flag explanations |
| resend | 6.12 | Transactional email (verification, welcome, suspicious-login alerts) |
| nodemailer | 9.0 | Lower-level mail transport used alongside Resend |
| axios | 1.18 | Outbound HTTP (Frankfurter exchange rate API) |
| uuid | 14.0 | Idempotency keys, S3 object keys, token families |
| winston + morgan | 3.19 / 1.11 | Structured JSON logging, HTTP request logging |
| dotenv | 17.4 | Environment variable loading |
| nodemon *(dev)* | 3.1 | Auto-reload during development |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| TypeScript | 5 (`~6.0` toolchain) | Type safety across the entire frontend |
| Vite | 8.0 | Build tool and dev server |
| React Router DOM | 7.18 | Client-side routing, nested layout routes, auth/admin guards |
| Zustand | 5.0 | In-memory auth state (access token + user — never persisted to storage) |
| Tailwind CSS | 4.3 (`@tailwindcss/vite`) | Utility-first styling |
| Framer Motion | 12.40 | Page-level and component-level animation throughout the app |
| Motion *(standalone)* | 12.40 | Used alongside Framer Motion for select components |
| GSAP + ScrollTrigger | 3.15 | Landing page footer's curtain-reveal + parallax effect, magnetic buttons |
| MapLibre GL | 5.24 | Interactive 3D globe on the landing page (Beirut hub + destination arcs) |
| socket.io-client | 4.8 | Real-time connection to the backend, shared via React context |
| @number-flow/react | 0.6 | Animated number transitions (pricing toggle, dashboard balances) |
| Lucide React | 1.21 | Icon set used throughout |
| Radix UI (checkbox, label, slot) | 1.x / 2.x | Headless primitives behind the shadcn-style `ui/` components |
| class-variance-authority + clsx + tailwind-merge | — | Conditional className composition for the `ui/` component layer |

### Infrastructure

| Service | Purpose |
|---|---|
| MySQL (local for dev) | Primary financial database |
| MongoDB Atlas | Audit log + AI insight storage |
| Redis Cloud | Caching, idempotency, rate limiting, session-adjacent counters |
| AWS S3 | Private-by-default avatar storage, public-read scoped only to `avatars/*` and `videos/*` |
| AWS EC2 *(provisioned, Phase 10 pending)* | Planned backend host — Docker installed, instance ready |
| Vercel *(planned)* | Frontend deployment target |
| Stripe | Subscription billing, Checkout, Billing Portal, webhooks |
| Resend (on `rakiz.uk`, a verified custom domain) | Transactional email, free tier, 3k/month |
| Frankfurter.app | Free, no-key live exchange rates |
| Cloudflare | Domain registration + DNS (`rakiz.uk`) |

---

## Architecture decisions worth knowing

- **Double-entry ledger, one chokepoint.** Every financial mutation — sends, splits, exchanges, link payments, admin adjustments — flows through a single function (`ledger.service.js`'s `transfer()`), which performs `SELECT FOR UPDATE` row locking on both wallets (in a consistent order to avoid deadlocks), writes a matching debit and credit, and only commits once both sides are correct. Fraud checks, audit logging, real-time emits, and notifications all fire after commit, never blocking or partially applying a transaction.
- **Idempotency is enforced before the database is touched.** A client-generated key is checked against Redis first; a cache hit returns the original result instead of reprocessing.
- **Currency exchange reuses the peer-to-peer transfer path.** Exchanging between your own wallets calls the exact same `transfer()` function as a send to another person, just with the same user as both sender and receiver — meaning it inherits the same locking, double-entry bookkeeping, and audit trail with no separate, less-tested code path.
- **JWT refresh rotation with family tracking.** Each refresh issues a new token and revokes the old one. If a *revoked* token is ever presented again — a sign of theft or reuse — the entire token family is killed, not just that one session.
- **AI never gets raw database access.** The natural-language search hands the model a bounded list of the user's own transactions and asks it to return matching IDs; the fraud-flag explainer hands it the specific flagged transaction plus the user's recent history. Neither path lets the model construct or run a query itself.
- **Stripe webhooks always return 200.** Internal processing issues are logged, not surfaced as webhook failures — this avoids Stripe's retry loop turning a logging hiccup into duplicate event processing.
- **Route protection is layered, not assumed.** `RequireAuth` gates every authenticated page; `RequireAdmin` additionally gates `/admin`. A logged-out visitor hitting any protected URL directly is redirected to `/login` before any page content renders, not after a failed API call.

---

## 📡 API Reference

All authenticated routes expect `Authorization: Bearer <accessToken>`. The refresh token lives in an httpOnly cookie, scoped to `/api/auth`.

### Authentication — `/api/auth`
```
POST   /api/auth/register              Create account (email, password, full_name, optional phone) → sends verification email
GET    /api/auth/verify-email          Verify email via signed token (?token=...)
POST   /api/auth/login                 Login → access token + refresh cookie + user object
POST   /api/auth/refresh               Rotate refresh token → new access token (used automatically by the frontend on 401)
POST   /api/auth/logout                Revoke the current session
GET    /api/auth/me                    Get the current user from a valid access token
GET    /api/auth/google                Begin Google OAuth flow
GET    /api/auth/google/callback       Google OAuth callback → redirects with access token in URL fragment
```

### Wallets — `/api/wallets`
```
GET    /api/wallets                       All of the current user's wallets
POST   /api/wallets                       Create a new currency wallet on demand (zero balance)
GET    /api/wallets/:currency             Get or lazily create a specific currency wallet
GET    /api/wallets/transactions          Paginated transaction history (?page, &limit, &currency)
POST   /api/wallets/send                  Send money by email or phone (Idempotency-Key header required)
POST   /api/wallets/exchange              Exchange between the user's own wallets (Idempotency-Key header required)
```

### Splits — `/api/splits`
```
GET    /api/splits                  All splits the user created or is a member of
POST   /api/splits                  Create a split (equal / custom / percentage)
GET    /api/splits/:id              Single split with full member breakdown
POST   /api/splits/:id/settle       Settle the current user's share (Idempotency-Key header required)
```

### Requests — `/api/requests`
```
GET    /api/requests                   List requests (?type=all|sent|received)
POST   /api/requests                   Create a payment request
GET    /api/requests/:id               Single request
POST   /api/requests/:id/pay           Pay a pending request
POST   /api/requests/:id/decline       Decline a pending request
POST   /api/requests/:id/cancel        Cancel a request you sent
```

### Payment Links — `/api/links`
```
GET    /api/links                  List the current user's links
POST   /api/links                  Create a link (fixed or open amount, single-use or reusable, optional expiry)
GET    /api/links/:id              Single link detail
DELETE /api/links/:id              Delete a link
GET    /api/links/pay/:token       PUBLIC — view a link's details, no auth required
POST   /api/links/pay/:token       Pay a link (auth required; Idempotency-Key header required)
```

### AI — `/api/ai`
```
POST   /api/ai/insights/generate    Generate (or regenerate) the insight for a given month ('YYYY-MM')
GET    /api/ai/insights/:month      Fetch a previously generated insight
POST   /api/ai/anomalies            Run anomaly detection for a given month
POST   /api/ai/search               Natural-language search across the user's own transactions
```

### Notifications — `/api/notifications`
```
GET    /api/notifications              Paginated list (?page, &limit, &unread_only=true|false) — includes unreadCount
PATCH  /api/notifications/:id/read     Mark a single notification read
PATCH  /api/notifications/read-all     Mark every notification read
```

### Users / Profile — `/api/users`
```
POST   /api/users/avatar               Upload a new avatar (multipart, 5MB max, JPEG/PNG/WebP) → uploads to S3, deletes the old file
PATCH  /api/users/profile              Update full_name and/or phone
POST   /api/users/change-password      Change password (requires current password) → revokes every other session
GET    /api/users/usage                Current tier + monthly send/split usage against the free-tier limits
GET    /api/users/sessions             List active sessions (device, IP, created/expires)
DELETE /api/users/sessions/:id         Revoke a single session
POST   /api/users/sessions/revoke-all  Revoke every active session
```

### Subscriptions — `/api/subscriptions`
```
POST   /api/subscriptions/checkout    Create a Stripe Checkout session for 'pro' or 'business'
POST   /api/subscriptions/portal      Create a Stripe Billing Portal session (manage/cancel)
POST   /api/subscriptions/webhook     Stripe webhook receiver — raw body, signature-verified, no auth (Stripe-only)
```

### Admin — `/api/admin` *(requires `role: admin`)*
```
GET    /api/admin/users                          Search/list users (?search, &status, &page, &limit)
GET    /api/admin/users/:id                       Full detail: wallets, fraud flags
PATCH  /api/admin/users/:id/status                Set status: active / frozen / suspended
POST   /api/admin/users/:id/adjust-balance        Manually adjust a wallet balance (requires a written reason)
GET    /api/admin/fraud-queue                     List fraud flags by status
PATCH  /api/admin/fraud-queue/:id                 Resolve or dismiss a flag
GET    /api/admin/fraud-queue/:id/explain         AI-generated explanation + recommendation for one flag
GET    /api/admin/revenue                         Platform stats: user tiers, transaction totals, fees, 30-day activity
```

### Health
```
GET    /api/health    Liveness check — { status: 'ok', service: 'rakiz-api', timestamp }
```

---

## 💡 Key Business Logic

| Concern | How it's actually handled |
|---|---|
| Idempotent sends | Every send/exchange/split-settle/link-pay requires a client-generated `Idempotency-Key` header, checked in Redis before the ledger function runs |
| Double-entry correctness | `ledger.service.js`'s `transfer()` is the *only* function permitted to move money — every other service calls into it rather than writing wallet balances directly |
| Currency conversion | Frankfurter.app for USD/EUR/GBP and the rest of its supported list; fixed real pegs for SAR (3.75/USD) and AED (3.6725/USD); a documented, intentionally-not-live snapshot rate for LBP |
| Free-tier enforcement | `tierLimits.service.js` counts the current calendar month's sends/splits from `transactions`/`splits` directly — not a cached counter — and blocks before the action, with an upgrade-aware error message |
| Self-settling a split | If the split's creator is also the member settling, no transfer is created (it would be a meaningless self-payment); the share is marked settled directly |
| Fraud detection | Rule-based (large amount per-currency thresholds, transaction velocity via a Redis counter, balance-drain ratio, new-IP login) — flags get written immediately; AI explanation is generated on-demand only when an admin opens a specific flag, not for every flag automatically |
| Session security | Refresh tokens are rotated on every use and grouped into a `family_id`; presenting an already-revoked token kills the whole family |
| Phone-based sending | Backend supports looking up a recipient by phone, but phone numbers are unverified by design — see Known Limitations below |

---

## 🔒 Security

- bcrypt password hashing, cost factor 12, with zxcvbn strength scoring at registration and password change
- JWT access + refresh tokens; refresh tokens are rotated on every use with family-based revocation on reuse detection
- Device fingerprinting bound to every session; full active-session visibility and revocation from the Profile page
- Email verification (signed token, single-use) before login is permitted; Google OAuth accounts are auto-verified
- Suspicious login detection — a new IP triggers an email alert via Resend
- Every financial mutation wrapped in a MySQL transaction with `SELECT FOR UPDATE` row locks on both wallets
- Idempotency keys checked in Redis before any transfer is processed
- AES-256-GCM encryption at rest for stored IP addresses (`users.last_login_ip`, `user_sessions.ip_address`)
- Layered rate limiting: global, per-user, per-endpoint, and progressive login lockout
- Helmet.js security headers, a strict CORS allowlist (frontend origin only), Joi validation on every request body/query/params
- Stripe webhook signature verification using the raw request body (mounted before the global JSON parser specifically so the raw bytes survive)
- `.env` never committed, enforced via `.gitignore`
- Admin routes gated by both authentication *and* an explicit role check (`requireAdmin`), never role-checked client-side only

---

## 📁 Project Structure

```
rakiz/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                   MySQL pool + MongoDB connection
│   │   │   ├── redis.js                Redis client
│   │   │   ├── mailer.js               Nodemailer/Resend transport
│   │   │   └── passport.js             Google OAuth strategy
│   │   ├── middleware/
│   │   │   ├── auth.js                 requireAuth, requireAdmin
│   │   │   ├── rateLimiter.js          loginLimiter, registerLimiter, emailLimiter, apiLimiter
│   │   │   └── validate.js             Joi schema validation middleware
│   │   ├── modules/
│   │   │   ├── auth/                   auth.routes.js, auth.controller.js, auth.service.js, token.service.js
│   │   │   ├── users/                  user.routes.js, user.controller.js, user.service.js
│   │   │   ├── wallets/                wallet.routes.js, wallet.controller.js, wallet.service.js
│   │   │   ├── splits/                 split.routes.js, split.controller.js, split.service.js
│   │   │   ├── requests/               request.routes.js, request.controller.js, request.service.js
│   │   │   ├── links/                  link.routes.js, link.controller.js, link.service.js
│   │   │   ├── ai/                     ai.routes.js, ai.controller.js, ai.service.js
│   │   │   ├── admin/                  admin.routes.js, admin.controller.js, admin.service.js
│   │   │   ├── notifications/          notification.routes.js, notification.controller.js, notification.service.js
│   │   │   └── subscriptions/          subscription.routes.js, subscription.controller.js, subscription.service.js
│   │   ├── services/
│   │   │   ├── ledger.service.js          Single chokepoint for all money movement
│   │   │   ├── idempotency.service.js     Redis-backed duplicate-request protection
│   │   │   ├── fraud.service.js           Rule engine + AI-generated flag explanations
│   │   │   ├── exchange.service.js        Live rates (Frankfurter) + fixed rates (SAR/AED/LBP)
│   │   │   ├── email.service.js           Resend wrapper (verification, welcome, alerts)
│   │   │   ├── ai.service.js              OpenAI wrapper for insights/anomalies/search
│   │   │   ├── socket.service.js          Socket.io JWT auth + emitToUser helper
│   │   │   ├── storage.service.js         S3 upload/delete for avatars
│   │   │   ├── tierLimits.service.js      Free-tier monthly send/split limits
│   │   │   └── audit.service.js           MongoDB audit event logging
│   │   ├── utils/
│   │   │   ├── encryption.js           AES-256-GCM helpers
│   │   │   └── fingerprint.js          Device fingerprinting for sessions
│   │   ├── database/
│   │   │   └── init.sql                Full MySQL schema — 13 tables
│   │   ├── app.js                      Express app, middleware order, route mounting
│   │   └── server.js                   HTTP server, Socket.io init, startup sequence
│   ├── SECURITY-NOTES.md                Living document of fixes, deferrals, and deploy checklist
│   ├── Dockerfile
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.tsx          Composes all 8 landing scenes + footer
    │   │   ├── LoginPage.tsx / RegisterPage.tsx
    │   │   ├── AuthCallback.tsx         Google OAuth token handoff
    │   │   ├── DashboardPage.tsx        Hero balance (with privacy blur toggle) + recent activity
    │   │   ├── WalletPage.tsx           Send / Exchange tabs + transaction history
    │   │   ├── SplitsPage.tsx           Create + settle splits, live progress bar
    │   │   ├── RequestsPage.tsx         Sent/received tabs, pay/decline/cancel
    │   │   ├── BillingPage.tsx          Tier, usage bars, Stripe Checkout/Portal
    │   │   ├── LinksPage.tsx            Create/copy/delete payment links
    │   │   ├── PayLinkPage.tsx          Public pay page for a shared link
    │   │   ├── AIPage.tsx               NL search, monthly insights, anomaly detection
    │   │   ├── NotificationsPage.tsx    Real-time list, mark read/unread, filters
    │   │   ├── ProfilePage.tsx          Avatar, inline edit, password, sessions, plan
    │   │   ├── AdminPage.tsx            Overview / Users / Fraud Queue tabs
    │   │   └── PrivacyPolicyPage.tsx / TermsOfServicePage.tsx / ContactPage.tsx
    │   ├── components/
    │   │   ├── AppLayout.tsx            Authenticated shell — top nav, bell badge, logout
    │   │   ├── RequireAuth.tsx          Auth route guard
    │   │   ├── RequireAdmin.tsx         Admin-only route guard
    │   │   ├── Hero.tsx / WalletScene.tsx / GlobeScene.tsx / SendScene.tsx /
    │   │   │   SplitScene.tsx / TrustScene.tsx / PricingScene.tsx / CTAScene.tsx
    │   │   │                           The 8 landing page scroll scenes
    │   │   ├── CinematicFooter.tsx      GSAP curtain-reveal footer
    │   │   ├── MagneticButton.tsx       GSAP cursor-follow button primitive
    │   │   ├── CharacterScene.tsx + CharacterEyes.tsx
    │   │   │                           Shared animated illustration for Login/Register
    │   │   └── ui/                     card.tsx, button.tsx, input.tsx, checkbox.tsx, label.tsx
    │   ├── hooks/
    │   │   └── useCharacterAnimation.ts  Mouse tracking, blink timers, typing reactions
    │   ├── context/
    │   │   └── SocketContext.tsx        Authenticated Socket.io connection + live unread count
    │   ├── store/
    │   │   └── authStore.ts             Zustand — in-memory access token + user (never persisted)
    │   └── lib/
    │       ├── api.ts                  Every backend call + apiFetch (auto 401 → refresh → retry)
    │       └── utils.ts                cn() className helper
    └── vite.config.ts
```

---

## 🗄️ MySQL Schema (13 tables)

| Table | Purpose |
|---|---|
| `users` | Accounts — email, phone, password hash, role, status, subscription tier, encrypted last login IP |
| `user_sessions` | Refresh token hashes, family IDs, device fingerprints, encrypted IP, revocation state |
| `wallets` | Per-user, per-currency balances (`DECIMAL(18,8)`) |
| `ledger_entries` | The double-entry source of truth — every debit/credit pair, idempotency key, type, exchange rate |
| `transactions` | User-facing record of sends/receives, linked to a ledger entry |
| `splits` | Split metadata — title, total, currency, type, status |
| `split_members` | Per-member share amount/percentage and settlement state |
| `payment_requests` | Requester/target, amount, status, expiry |
| `payment_links` | Token, optional fixed amount, single-use flag, use count, expiry |
| `fraud_flags` | Rule triggered, severity, status, linked ledger entry, review metadata |
| `notifications` | Per-user notification feed with read state and a polymorphic reference |
| `exchange_rate_cache` | Cached Frankfurter rates |
| `webhooks` | Reserved for future outbound webhook support (Business tier) |

## MongoDB Collections
- `audit_events` — every auth event, financial mutation, and admin action, with before/after state where relevant
- `ai_insights` — generated monthly insight documents, keyed by user + month

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MySQL 8.0 (running locally or via a managed provider)
- A MongoDB Atlas cluster
- A Redis instance (Redis Cloud or local)
- An OpenAI API key
- An AWS account (S3 bucket)
- A Stripe account (test mode is fine)
- A Resend account with a verified sending domain
- Google OAuth credentials (for social login)

### 1. Clone and install
```bash
git clone https://github.com/Abdallah-khatib-7/rakiz.git
cd rakiz
```

### 2. Backend
```bash
cd backend
npm install
mysql -u root -p < src/database/init.sql
```

Create `backend/.env`:
```
PORT=5000
NODE_ENV=development

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=rakiz

MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/rakiz

REDIS_URL=redis://default:password@host:port

JWT_ACCESS_SECRET=a_long_random_string
JWT_REFRESH_SECRET=a_different_long_random_string

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

OPENAI_API_KEY=sk-...

FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
# Rakiz API running on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
# App running on http://localhost:5173
```

### 4. Testing real Stripe checkout locally
In a separate terminal, the whole time you're testing billing:
```bash
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```
Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` in `backend/.env` and restart the backend. This is dev-only — production registers a real webhook URL directly in the Stripe Dashboard.

---

## Known limitations / honest caveats

These are deliberate, documented scope decisions — not oversights. Full detail in `backend/SECURITY-NOTES.md`.

- **No SMS phone verification.** Phone numbers can be added to a profile and used as a send target, but they're unverified — sending money to an unverified phone number isn't exposed as a trusted path. Real SMS OTP (Twilio Verify) was scoped and costed (~$0.05/verification, no viable free tier for arbitrary new users) and deliberately deferred.
- **LBP exchange rate is a fixed snapshot, not live.** Frankfurter.app doesn't carry LBP at all. The rate in use (89,000/USD as of June 2026) will drift as Lebanon's real market rate moves — documented in code comments and `SECURITY-NOTES.md`.
- **No yearly Stripe billing.** The pricing toggle computes and displays yearly prices for comparison, but only monthly Stripe price IDs exist; both CTAs currently route through monthly checkout.
- **Contact form is visual-only** — no backend endpoint sends it anywhere yet.
- **No standalone logo/icon design** — RAKIZ appears as a typographic wordmark throughout; a minimal SVG favicon mark was added for deployment, but no full brand mark was designed.
- **Phase 10 (production deployment) has not happened yet** — EC2 instance is provisioned with Docker installed, but the backend, nginx + Certbot SSL, and frontend Vercel deploy are still pending.

---

## 👨‍💻 About

I'm Abdallah Khatib, a Computer Science graduate from Lebanese International University 🇱🇧, with 5+ years of pharmacy experience prior to this. Rakiz is my fourth full-stack system, following:

- **PharmaCare** — pharmacy management with AI-powered drug interaction checking
- **Tawla** — multi-tenant SaaS restaurant POS with real-time Socket.io and an AI upsell engine
- **AceIt** — AI interview coaching platform with CV scoring, mock interviews, and skill quizzes

Every one of these was built from scratch — schema, API, frontend, deployment — no templates, no boilerplate skipped.

📧 abdallah.khatib2003@gmail.com

---

## 📄 License

This project is for portfolio and demonstration purposes. All rights reserved © 2026 Abdallah Khatib.