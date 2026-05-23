# Vaultis — Presentation FAQ & Overview

Purpose: a one-page FAQ and flow reference for a presenter who may not be familiar with the codebase. Use this to answer common audience questions and to narrate key flows.

---

**Elevator pitch**
- Vaultis is a demo private-banking app that evaluates each transfer with a real-time fraud engine (9 signals) and applies adaptive friction (PIN, biometric, cooling-off, or human review).

---

**Quick architecture (who does what)**
- Frontend: Next.js app (app/). Renders pages, handles WebAuthn flows in-browser.
- Backend API: Next.js API routes (app/api/*). Handles auth, WebAuthn challenge/verify, transaction lifecycle, admin endpoints.
- DB: Prisma + SQLite (local file `dev.db` by default). Prisma Client in `lib/prisma.ts`.
- Auth: JWT cookies for users and admins (`lib/auth.ts`). Secrets come from `.env`.
- WebAuthn: `@simplewebauthn/server` + client integration; server verifies challenges and stores public keys.
- Fraud engine: logic in `lib/fraud/engine.ts` — computes scores from signals and routes action.

---

**Key presenter flows (short step lists)**

1) Register & setup biometrics
- User registers at `/register` → account created (DB). 
- Presenter: show profile → "Setup Secure Transactions" → add biometric (WebAuthn).
- Result: device becomes trusted; risk for future transfers is reduced.

2) Send money (happy path)
- User fills `/send` with recipient & amount.
- Server runs fraud engine → score under threshold → immediate `COMPLETED`.
- Presenter: highlight low friction + fast UX.

3) Step-up (PIN / Biometric)
- If score hits threshold, server redirects to `/step-up/pin` or `/step-up/biometric`.
- PIN: user enters PIN (verified via bcrypt-hash). Biometric: WebAuthn challenge.
- After success, transfer completes.

4) Cooling-off / Admin queue
- Very high score triggers cooling-off (30 minutes) or sends to admin review.
- Admin UI: `/admin/queue` — human approves or rejects.

---

**Most-asked technical Q&A (short answers)**

Q: Where is the database stored?
A: Local SQLite file by default. `DATABASE_URL="file:./dev.db"` in `.env` (repo root). Prisma config resolves path in `prisma.config.ts` and `lib/prisma.ts`.

Q: How do I reset & seed the DB?
A: From repo root run:

```bash
npm install
npx prisma generate
npx prisma db push --force-reset
npx prisma db seed
```

Q: Why did `npx prisma db seed` fail earlier?
A: The generated Prisma client must exist for TypeScript `ts-node` to compile the seed. If you see a `PrismaClient` import error, run `npx prisma generate` first (fixed in repo already).

Q: Where are seed and migration config?
A: Seed script: `prisma/seed.ts`. Prisma config: `prisma.config.ts`. `package.json` also lists the seed command used.

Q: Where are secrets / env vars?
A: Root `.env` — `DATABASE_URL`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`.

Q: How does auth work?
A: JWT cookies: user cookie `vaultis_token`, admin cookie `vaultis_admin_token` (see `lib/auth.ts`). Signing secrets from `.env`.

Q: How does WebAuthn work in the app?
A: Browser requests an option from server (`/api/webauthn/*/options`) → client calls authenticator → server verifies assertion (`/api/webauthn/*/verify`) and stores public key in DB (`WebAuthnCredential` model).

Q: Where is the fraud logic?
A: `lib/fraud/engine.ts`. It converts signals into weights, computes score, and maps score to an action (ALLOW, STEP_UP_PIN, STEP_UP_BIOMETRIC, COOLING_OFF, ADMIN_QUEUE).

Q: How to allow additional dev origins for WebAuthn / Next?
A: See `next.config.ts` -> `allowedDevOrigins`. You can add IPs or change to env-driven list. (Repo already updated.)

Q: How to run the app locally?
A: After install + generate + seed:

```bash
npm run dev
# open http://localhost:3000
```

Q: Where to change thresholds or weights?
A: Edit `lib/fraud/engine.ts`. Tests or demo parameters may live in `prisma/seed.ts` (sample transactions & users).

Q: Where are presenter/demo accounts?
A: Created by seed: `ardit@demo.al`, `giulia@demo.it`, `hans@demo.de`, `ivan@demo.ru`, `sara@demo.us`. Passwords: `Demo123!` (PINs `1234`). Admin: `admin@vaultis.al / Admin123!`.

---

**Suggested short answers for non-technical audience**
- Q: "How do you protect accounts?"
  - A: "Every transfer is scored by nine signals — if it's risky we add friction such as asking for a PIN, asking for a biometric check, delaying the transfer briefly, or routing it to a human."

- Q: "Does biometric data leave the device?"
  - A: "No. We only store public keys and counters via WebAuthn — raw biometric data never leaves the user's device."

- Q: "Is this legal?"
  - A: "We built with GDPR in mind: we pseudonymize device data, provide controls, and use human review for high-impact automated decisions (Article 22 considerations)."

---

**Presenter checklist (quick)**
- Run seed and dev server: `npx prisma generate && npx prisma db push --force-reset && npx prisma db seed && npm run dev`
- Demo accounts ready: `ardit@demo.al` etc.
- Two browsers: normal + incognito for unknown-device scenarios.
- Admin tab: `http://localhost:3000/admin/login` (Admin123!).

---

**How we secure data & GDPR (short explainer)**
- **Biometrics / WebAuthn:** the app never stores raw biometric data. It uses WebAuthn passkeys: the browser/device produces a public key and a counter which the server stores in the `WebAuthnCredential` table (see `prisma/schema.prisma`). The private key and biometric templates remain on-device and never leave the authenticator.
- **Passwords & PINs:** passwords and PINs are hashed with `bcrypt` before storage (`passwordHash`, `pin`) so raw secrets are never kept in the DB.
- **Device identification:** the app records a hashed device identifier (not a raw hardware ID). The consent modal explains we collect a hashed device ID and a country code only — no GPS coordinates. Device records live in `DeviceSession` (`deviceHash`, `countryCode`, `trusted`, `consentGiven`).
- **Location data:** we store only a country code when needed; precise location is not collected or persisted.
- **Risk & audit data:** the `RiskEvent` and transaction models store flags, scores, and action decisions to keep the risk engine auditable. These are pseudonymised to avoid exposing raw device/person identifiers where not needed.
- **Secrets & environment:** signing keys and sensitive config (`JWT_SECRET`, `ADMIN_JWT_SECRET`, `DATABASE_URL`, `WEBAUTHN_ORIGIN`, etc.) live in the root `.env` and are not checked into source (the repo `.gitignore` excludes `.env*`).
- **GDPR & user controls:** the UX provides clear consent before device identification; users can remove devices (the app supports erasure of device records), and demo notes indicate risk events linked to removed devices are purged within a configured retention window (example: 90 days). High-impact automated decisions route to human review to comply with Article 22-style constraints.
- **Minimal data principle:** only the minimum data needed for fraud detection is collected (hashed device ID, country code, WebAuthn public key, transaction metadata). Sensitive material (raw biometrics, precise GPS) is never stored.


If you want, I can also:
- generate a one-page slide-friendly version (short bullets),
- add a simple sequence diagram for the Send flow, or
- create a printable cheat-sheet for the presenter.

File created: `PRESENTATION_FAQ.md` (repo root).
