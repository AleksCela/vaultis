# Claude Code Prompt — CIT Hackathon 2026
## Vaultis — AI-Powered Fraud Detection Banking MVP

---

## Project Overview

Build a full-stack banking MVP called **"Vaultis"** — a fictional digital bank with a real fraud detection engine built for a hackathon demo. Everything is real CRUD. Users start with €30,000.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via Prisma (datasource `provider = "sqlite"`, file: `./dev.db`). Use `better-sqlite3` as the underlying driver. Zero config, no DB server needed.
- **Auth**: Simple email + password. bcrypt for hashing. JWT stored in httpOnly cookie. Single `lib/auth.ts` helper with `signToken` / `verifyToken` / `getSession`. Middleware protects `/dashboard`, `/send`, `/transactions`, `/profile`, `/admin/*`. That's it — no refresh tokens, no OAuth, no magic links.
- **Device fingerprinting**: `@fingerprintjs/fingerprintjs` (free, client-side)
- **Biometrics**: `@simplewebauthn/browser` (client) + `@simplewebauthn/server` (server). rpID: `localhost` for dev.
- **Geolocation**: browser `navigator.geolocation` → reverse geocode to country only via `https://api.country.is/{lat},{lng}` (free, no key needed) → store only the country code
- **Styling**: Tailwind CSS, **mobile-first throughout**. All components built for 375px base, scaling up. Never write desktop-first and override.

---

## Design & UI

**Aesthetic**: Refined dark luxury banking — Bloomberg Terminal meets private Swiss bank. 

- Colors: deep navy background `#0a0e1a`, gold accent `#c9a84c`, white text, subtle charcoal cards `#111827`
- Fonts: `Instrument Serif` (headings), `JetBrains Mono` (numbers, IBANs, amounts), `Inter` (body)
- Subtle grid texture overlay on background
- Cards: thin gold border `1px solid rgba(201,168,76,0.3)`, slight glass morphism
- Animated status indicators, count-up balance animation on dashboard
- This should look like the most expensive bank UI a hackathon has ever seen

**Client app layout (mobile-first)**:
- Fixed bottom navigation bar (like a real banking app): Dashboard | Send | Transactions | Profile
- No sidebar on mobile
- Full-screen cards, large touch targets (min 44px), thumb-friendly bottom actions

**Admin layout (desktop)**:
- Left sidebar navigation
- Multi-column dashboard grid
- Data-dense tables are fine here

---

## Database Schema (Prisma + SQLite)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                   String               @id @default(cuid())
  email                String               @unique
  passwordHash         String
  fullName             String
  iban                 String               @unique
  balance              Float                @default(30000)
  country              String               @default("AL")
  pin                  String               // 4-digit PIN, bcrypt hashed
  createdAt            DateTime             @default(now())

  sentTransactions     Transaction[]        @relation("Sender")
  receivedTransactions Transaction[]        @relation("Receiver")
  deviceSessions       DeviceSession[]
  webAuthnCredentials  WebAuthnCredential[]
  riskEvents           RiskEvent[]
}

model Transaction {
  id           String            @id @default(cuid())
  senderId     String
  receiverId   String
  amount       Float
  description  String?
  status       String            @default("PENDING")
  // Status values: COMPLETED | PENDING_STEP_UP | PENDING_BIOMETRIC | COOLING_OFF | PENDING_ADMIN | BLOCKED | CANCELLED
  riskScore    Int               @default(0)
  riskFlags    String            // JSON string — array of {code, label, weight}
  riskAction   String            @default("ALLOW")
  // Action values: ALLOW | STEP_UP_PIN | STEP_UP_BIOMETRIC | COOLING_OFF | ADMIN_QUEUE
  cooldownEndsAt DateTime?
  adminNote    String?
  createdAt    DateTime          @default(now())
  resolvedAt   DateTime?

  sender       User              @relation("Sender", fields: [senderId], references: [id])
  receiver     User              @relation("Receiver", fields: [receiverId], references: [id])
}

model DeviceSession {
  id           String    @id @default(cuid())
  userId       String
  deviceHash   String    // SHA-256 of FingerprintJS visitorId — never raw
  deviceLabel  String?   // e.g. "Chrome on macOS"
  countryCode  String?   // country only, never coordinates
  trusted      Boolean   @default(false)
  consentGiven Boolean   @default(false)
  firstSeen    DateTime  @default(now())
  lastSeen     DateTime  @default(now())

  user         User      @relation(fields: [userId], references: [id])
}

model WebAuthnCredential {
  id           String    @id @default(cuid())
  userId       String
  credentialId String    @unique
  publicKey    String    // base64 encoded
  counter      Int       @default(0)
  createdAt    DateTime  @default(now())

  user         User      @relation(fields: [userId], references: [id])
}

model WebAuthnChallenge {
  id           String    @id @default(cuid())
  userId       String
  challenge    String
  createdAt    DateTime  @default(now())
  // Clean these up after use or after 5 minutes
}

model RiskEvent {
  id            String    @id @default(cuid())
  userId        String
  transactionId String?
  score         Int
  flags         String    // JSON string
  action        String
  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
}

model AdminUser {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
}
```

> Note: SQLite doesn't have a native Decimal type — use Float for balance and amount, but do all arithmetic in integers (cents) in application code to avoid float precision bugs. Multiply by 100 before math, divide after.

---

## GDPR Layer (lightweight but real)

- On first visit to `/send`, if no consent recorded for this device session, show a bottom-sheet consent modal: *"To protect your account, we collect a hashed device ID and your country. We never store your precise location or any identifiable device data."* Accept / Decline. Declining = device treated as unknown (higher risk), user is told this.
- Store only `SHA-256(visitorId)` — never raw FingerprintJS ID. Hash client-side using Web Crypto API before sending.
- Store only country code from geolocation — never lat/lng.
- Profile page → "My Devices" tab: list DeviceSessions, allow deletion (right to erasure). Call `DELETE /api/user/devices/[id]`.
- Comment in code: `// TODO: Add cron job to delete RiskEvents older than 90 days (GDPR retention)`

---

## Pages & Routes

### Public
- `/` — Landing page. Dark luxury hero. Tagline: *"Security that thinks. Banking that flows."* Login + Register CTAs. Show 3 feature highlights (fraud detection, biometric auth, real-time protection).
- `/login` — Email + password form. Link to register.
- `/register` — Full name, email, password, 4-digit PIN (PIN used for step-up later). IBAN auto-generated server-side.

### Client App (mobile-first, bottom nav)
- `/dashboard` — Balance card with animated count-up, last 3 transactions, big "Send Money" CTA button
- `/send` — Send form: IBAN lookup (show receiver name on valid IBAN), amount, description, Send button. Fraud engine runs on submission.
- `/transactions` — Full history. Status badges. Tap any transaction to expand and see RiskCard if flagged.
- `/profile` — User info, IBAN display, "My Devices" list, "Add Biometric" button, logout

### Step-Up Pages (full screen, mobile)
- `/step-up/pin?txId=...` — Enter your 4-digit PIN to continue. On success → complete transaction.
- `/step-up/biometric?txId=...` — "Verify with Face ID / Fingerprint" button. WebAuthn challenge. On success → complete transaction.
- `/step-up/cooling-off?txId=...` — Countdown timer (30 min), RiskCard explaining why, Cancel button. Auto-completes when timer hits 0.
- `/step-up/blocked?txId=...` — "Transfer under review" screen with RiskCard. "Our team will review this within minutes."

### Admin (desktop)
- `/admin/login` — Separate login, separate JWT cookie (`admin_token`)
- `/admin/dashboard` — Stats row + live risk event feed + pending queue count
- `/admin/queue` — Cards for each PENDING_ADMIN transaction. Full detail (sender name, receiver IBAN, amount, RiskCard). Approve / Reject with optional note.
- `/admin/events` — Scrollable feed of all RiskEvents, pseudonymous (first 8 chars of userId), with score badge and flags summary

---

## Fraud Engine — `lib/fraud/engine.ts`

### Input
```typescript
interface FraudInput {
  senderId: string
  receiverIban: string
  amount: number          // in euros (float)
  deviceHash: string | null
  deviceCountry: string | null
  hour: number            // 0-23 local hour
}
```

### Flags

```typescript
const HIGH_RISK_COUNTRIES = ['RU', 'KP', 'IR', 'BY', 'SY', 'MM', 'LY', 'SD', 'VE', 'CU']

const FLAGS = {
  UNKNOWN_DEVICE:       { code: 'UNKNOWN_DEVICE',       label: 'Unrecognized device',                             weight: 20 },
  HIGH_RISK_COUNTRY:    { code: 'HIGH_RISK_COUNTRY',    label: 'Transfer to high-risk country',                   weight: 30 },
  LOCATION_MISMATCH:    { code: 'LOCATION_MISMATCH',    label: 'Your location differs from recipient country',     weight: 15 },
  AMOUNT_ABOVE_AVERAGE: { code: 'AMOUNT_ABOVE_AVERAGE', label: 'Amount above your usual transfers',               weight: 15 },
  DRAINING_BALANCE:     { code: 'DRAINING_BALANCE',     label: 'Transfer exceeds 80% of your balance',            weight: 20 },
  NEW_BENEFICIARY:      { code: 'NEW_BENEFICIARY',      label: 'First transfer to this recipient',                weight: 10 },
  HIGH_VELOCITY:        { code: 'HIGH_VELOCITY',        label: '3+ transfers in the last 10 minutes',             weight: 25 },
  UNUSUAL_HOUR:         { code: 'UNUSUAL_HOUR',         label: 'Unusual hour for your account activity',          weight: 10 },
  LARGE_ROUND_NUMBER:   { code: 'LARGE_ROUND_NUMBER',   label: 'Large round-number amount (fraud pattern)',        weight: 10 },
}
```

### Logic notes
- `UNKNOWN_DEVICE`: deviceHash not found in user's DeviceSessions
- `HIGH_RISK_COUNTRY`: receiver's `User.country` is in HIGH_RISK_COUNTRIES list
- `LOCATION_MISMATCH`: deviceCountry !== receiver's User.country (skip if deviceCountry is null)
- `AMOUNT_ABOVE_AVERAGE`: amount > 2× average of sender's last 10 completed transactions. If no history, flag if amount > €500
- `DRAINING_BALANCE`: amount > 0.8 × sender.balance
- `NEW_BENEFICIARY`: no prior completed transaction from sender to this receiver
- `HIGH_VELOCITY`: sender has 3+ transactions (any status) in the last 10 minutes
- `UNUSUAL_HOUR`: if sender has transaction history, flag if current hour is outside their historical active hours range. If no history, flag hours 0–5.
- `LARGE_ROUND_NUMBER`: amount >= 1000 and amount % 500 === 0

### Scoring & Action
```typescript
function getAction(score: number): string {
  if (score <= 30) return 'ALLOW'
  if (score <= 55) return 'STEP_UP_PIN'
  if (score <= 75) return 'STEP_UP_BIOMETRIC'
  if (score <= 89) return 'COOLING_OFF'
  return 'ADMIN_QUEUE'
}
```

Engine returns `{ score, flags: appliedFlags[], action }`.

---

## Transaction State Machine

```
INITIATE (fraud engine runs)
  → ALLOW          → immediately deduct balance → status: COMPLETED
  → STEP_UP_PIN    → status: PENDING_STEP_UP  → PIN verified → COMPLETED
  → STEP_UP_BIO    → status: PENDING_BIOMETRIC → WebAuthn verified → COMPLETED
  → COOLING_OFF    → status: COOLING_OFF → timer expires or user cancels
                     on expire → COMPLETED
                     on cancel → CANCELLED
  → ADMIN_QUEUE    → status: PENDING_ADMIN → admin approves → COMPLETED
                                           → admin rejects  → BLOCKED
```

Balance is only deducted when status transitions to COMPLETED. Check sender balance hasn't changed between initiation and completion.

---

## RiskCard Component — `components/RiskCard.tsx`

Reusable. Shown on transaction detail, step-up pages, admin queue cards.

```
┌─────────────────────────────────────────────┐
│  Risk Score: 72 / 100            ● HIGH      │
├─────────────────────────────────────────────┤
│  Why this transfer was flagged:              │
│                                              │
│  ⚠  Unrecognized device              +20    │
│  ⚠  First transfer to this recipient  +10   │
│  ⚠  Amount above your usual transfers +15   │
│  ⚠  Unusual hour for your account     +10   │
│  ⚠  Transfer exceeds 80% of balance   +20   │
│                                              │
│  Action: Biometric verification required     │
└─────────────────────────────────────────────┘
```

Style: thin gold border, dark card, amber ⚠ icons, JetBrains Mono for score and weights.

---

## WebAuthn Flow

### Register (`/profile` → "Add Biometric")
1. Client calls `POST /api/webauthn/register/options`
2. Server generates options via `generateRegistrationOptions`, saves challenge to `WebAuthnChallenge`
3. Client calls `startRegistration(options)` from `@simplewebauthn/browser`
4. Client sends response to `POST /api/webauthn/register/verify`
5. Server verifies, saves credential to `WebAuthnCredential`

### Authenticate (step-up at `/step-up/biometric`)
1. Client calls `POST /api/webauthn/auth/options?txId=...`
2. Server generates options, saves challenge
3. Client calls `startAuthentication(options)`
4. Client sends response to `POST /api/webauthn/auth/verify?txId=...`
5. Server verifies, updates counter, calls complete transaction logic

Use `rpID: process.env.WEBAUTHN_RP_ID || 'localhost'` and `origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000'`.

---

## API Routes

```
POST /api/auth/register          { fullName, email, password, pin }
POST /api/auth/login             { email, password }
POST /api/auth/logout

GET  /api/user/me
GET  /api/user/devices
DELETE /api/user/devices/[id]

POST /api/transactions/initiate  { receiverIban, amount, description, deviceHash, deviceCountry }
POST /api/transactions/complete  { txId }        ← called after step-up success
POST /api/transactions/cancel    { txId }
GET  /api/transactions

POST /api/transactions/pin-verify  { txId, pin }  ← verify PIN, then call complete

POST /api/webauthn/register/options
POST /api/webauthn/register/verify
POST /api/webauthn/auth/options
POST /api/webauthn/auth/verify

POST /api/admin/login
GET  /api/admin/stats
GET  /api/admin/queue
POST /api/admin/queue/[txId]/approve  { note? }
POST /api/admin/queue/[txId]/reject   { note? }
GET  /api/admin/events
```

---

## Seed Script — `prisma/seed.ts`

Create:
- 1 admin: `admin@vaultis.al` / `Admin123!`
- 5 users, each €30,000, different countries:
  - `ardit@demo.al` / `Demo123!` — country: AL
  - `giulia@demo.it` / `Demo123!` — country: IT
  - `hans@demo.de` / `Demo123!` — country: DE
  - `ivan@demo.ru` / `Demo123!` — country: RU  ← triggers HIGH_RISK_COUNTRY flag
  - `sara@demo.us` / `Demo123!` — country: US
- All users have PIN: `1234` (hashed)
- 8–10 sample transactions at various risk levels so dashboard isn't empty on demo

---

## Environment Variables — `.env`

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="vaultis-hackathon-secret-change-in-prod"
ADMIN_JWT_SECRET="vaultis-admin-secret-change-in-prod"
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_ORIGIN="http://localhost:3000"
```

---

## Implementation Notes

- All money math: convert to cents (`amount * 100`) before arithmetic, convert back for display. Never do `balance - amount` with raw floats.
- IBAN format: `AL` + 2 random digits + 16 random digits. Display with spaces every 4 chars. Store without spaces.
- Hash device fingerprint client-side: `crypto.subtle.digest('SHA-256', encoder.encode(visitorId))` → hex string → send to server.
- Cache geolocation country in `sessionStorage` as `vaultis_country` — request it once per session on `/send` page load.
- JWT middleware: check cookie `vaultis_token` for user routes, `vaultis_admin_token` for admin routes.
- All admin actions: `console.log('[AUDIT]', adminId, action, txId, timestamp)` — comment says "replace with DB audit table in production".
- SQLite note: Prisma SQLite doesn't support all Decimal operations — keep balance as Float in schema, handle precision in app code.
- No external services required. Runs with `npm run dev` after `npx prisma db push && npx prisma db seed`.