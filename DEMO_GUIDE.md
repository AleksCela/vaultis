# Vaultis — Demo Presentation Guide
### CIT Hackathon 2026

---

## Before You Walk Up

- [ ] `npm run dev` running, browser open at `http://localhost:3000`
- [ ] DB freshly reset: `npx prisma db push --force-reset && npm run seed`
- [ ] Two browsers ready: **Chrome** (normal) + **Chrome Incognito** (or Firefox)
- [ ] Admin tab open: `http://localhost:3000/admin/login`
- [ ] Phone (optional): same WiFi, access via local IP — biometrics demo only works on laptop
- [ ] Zoom in browser to ~125% so text is readable from distance
- [ ] Open `ardit@demo.al` in normal Chrome, stay on landing page

---

## The Pitch (30 seconds, landing page)

**What to show:** `http://localhost:3000`

Point out:
- The hero tagline — "Security that thinks. Banking that flows."
- The **AI-Powered Fraud Detection — Live** pill badge
- The **"Setup Secure Transactions"** gold glowing section — explain this is what
  greets every new user. It's not optional UI — it's a security onboarding gate.
- The **9 Signals grid** — scroll down, show each signal has a weight and explanation
- The **GDPR Transparency section** — point out the legal citations (Art. 6(1)(f),
  PSD2, AML Directive). "We didn't just build fraud detection — we built it legally."

**One-liner to say:**
> "Every transfer runs through 9 real-time risk signals. The score determines
> what happens next — instant approval, PIN, biometrics, a 30-minute hold,
> or a human review queue. All automated. All GDPR compliant."

📸 **Screenshot**: Landing page hero + the gold "Setup Secure Transactions" section

---

## Act 1 — Account Setup (2 min)

**What to show:** Register a new account live, OR use pre-seeded `ardit@demo.al`

If registering live:
1. Go to `/register`
2. Fill in name, email, password, PIN `1234`
3. Show IBAN is auto-generated (Albanian format, displayed formatted)
4. Redirect lands on `/dashboard`

**On the dashboard:**
- Point out the pulsing gold **"Setup Secure Transactions"** card
- Say: "This only shows when biometrics aren't registered. It disappears once you set them up."
- Click it → goes to Profile

**On Profile → Account Info:**
- Show the animated gold hero card: "Setup Secure Transactions"
- Walk through the 4 benefit tiles: Lowers risk score / PSD2 SCA / On-device only / Faster approvals
- Click **"Add Biometric Authentication"**
- Complete Face ID / fingerprint on your laptop

**After success:**
- Go back to Dashboard — the CTA card is **gone**
- Say: "The system now knows this is a trusted device with biometric enrolled.
  Your baseline risk score just dropped significantly."

📸 **Screenshot**: Dashboard with the glowing CTA card  
📸 **Screenshot**: Profile biometric hero card  
📸 **Screenshot**: Dashboard after setup — CTA gone, clean view

---

## Act 2 — The Fraud Engine: 5 Outcomes (5 min)

Use **normal Chrome** logged in as `ardit@demo.al` for all of these.
Reset DB between full runs if needed.

---

### Outcome 1 — ALLOW (score 0–30)

**Setup:** Second transfer to same recipient (Giulia), small amount

1. Go to `/send`
2. Accept the **privacy consent modal** — point out:
   - SHA-256 hashing explanation
   - Country-code only, never GPS
   - GDPR legal basis cited inline
   - The risk score impact table (−20 pts for recognized device)
3. Enter Giulia's IBAN (`giulia@demo.it`, look up her IBAN on her profile or from seed output)
4. Amount: **€150**
5. Submit → instant **"Transfer Complete"**

**Say:** "Score was under 30. No friction. Exactly what low-risk transfers should feel like."

📸 **Screenshot**: Privacy consent modal (full GDPR disclosure)  
📸 **Screenshot**: Success redirect to transactions

---

### Outcome 2 — PIN Step-Up (score 31–55)

**Setup:** First transfer to Hans, amount above €500

1. Stay in normal Chrome as `ardit@demo.al`
2. Send **€600** to Hans (`hans@demo.de`)
3. Fraud engine fires: `NEW_BENEFICIARY` (+10) + `AMOUNT_ABOVE_AVERAGE` (+15) + `UNKNOWN_DEVICE` (+20) = **45 pts**
4. Redirects to `/step-up/pin`

**On the PIN page — point out:**
- The "STEP-UP REQUIRED · PIN" badge
- The explanation card: why this happened, PSD2 SCA reference, bcrypt hash note
- Enter PIN `1234` → transfer completes

**Say:** "45 points. The system doesn't block it — it just asks for confirmation.
PIN is 'something you know' under PSD2 SCA. Bcrypt hashed — we never see the raw value."

📸 **Screenshot**: PIN step-up page with the explanation card visible

---

### Outcome 3 — Biometric Step-Up (score 56–75)

**Setup:** Use Incognito (unknown device) + send above average amount

1. Open **Incognito** window, log in as `giulia@demo.it` (Demo123!)
2. Go to `/send`, **decline** the privacy consent (or accept — doesn't matter, device is still unknown)
3. Send **€800** to Hans (`hans@demo.de`)
4. Flags: `UNKNOWN_DEVICE` (+20) + `NEW_BENEFICIARY` (+10) + `AMOUNT_ABOVE_AVERAGE` (+15) + `LOCATION_MISMATCH` (+15) = **60 pts**
5. Redirects to `/step-up/biometric`

**On the biometric page — point out:**
- The "STEP-UP REQUIRED · BIOMETRIC" badge
- The explanation: risk threshold 56–75, PSD2 SCA, WebAuthn note ("data never leaves device")
- If biometrics set up on this machine: complete it. If not: show the page, cancel.

**Say:** "Biometric is 'something you are' under PSD2 SCA. The challenge is generated
server-side, verified server-side. The raw fingerprint never touches our server — WebAuthn standard."

📸 **Screenshot**: Biometric step-up page with the why-card visible

---

### Outcome 4 — Cooling-Off (score 76–89)

**Setup:** Large drain from Incognito

1. Stay in Incognito as `giulia@demo.it`
2. Send **€25,000** to Sara (`sara@demo.us`)
3. Flags: `DRAINING_BALANCE` (+20) + `UNKNOWN_DEVICE` (+20) + `AMOUNT_ABOVE_AVERAGE` (+15) + `NEW_BENEFICIARY` (+10) + `LARGE_ROUND_NUMBER` (+10) = **75 pts → COOLING_OFF**
   - (Add `LOCATION_MISMATCH` +15 if country detected ≠ US → hits 89)
4. Redirects to `/step-up/cooling-off`

**On the cooling-off page — point out:**
- The countdown timer (30 minutes)
- The RiskCard showing score, all triggered flags, weights, GDPR legal basis note
- Cancel button is available — user can abort

**Say:** "This is a mandatory cooling-off under our AML-inspired policy.
30 minutes gives the account holder time to notice if it's not them. Auto-completes — no admin needed."

📸 **Screenshot**: Cooling-off page with countdown + full RiskCard

---

### Outcome 5 — Admin Queue (score 90–100)

**Setup:** Incognito + send to Ivan (Russia) + large round amount

1. Stay in Incognito (or open fresh), log in as `ardit@demo.al`
2. Send **€20,000** to Ivan (`ivan@demo.ru`)
3. Flags: `HIGH_RISK_COUNTRY` (+30) + `UNKNOWN_DEVICE` (+20) + `DRAINING_BALANCE` (+20) + `LARGE_ROUND_NUMBER` (+10) + `NEW_BENEFICIARY` (+10) = **90 pts**
4. Redirects to `/step-up/blocked` — "Transfer Under Review"

**Switch to Admin tab:**
1. Login: `admin@vaultis.al` / `Admin123!`
2. Go to `/admin/queue`
3. Show the pending transaction card — full detail: sender, amount, recipient IBAN, RiskCard
4. Click **Approve** or **Reject** with a note like "Flagged: sanctioned jurisdiction + unusual amount"
5. Show the risk event feed at `/admin/events`

**Say:** "Score 90+. No automation. A human reviews it. This is our interpretation of
Article 22 GDPR — no fully automated decision with significant effect on the user
without human oversight."

📸 **Screenshot**: `/step-up/blocked` page  
📸 **Screenshot**: Admin queue with RiskCard for the flagged transfer  
📸 **Screenshot**: Admin events feed (pseudonymised user IDs)

---

## Act 3 — GDPR Story (1 min)

**What to show:** Profile → My Devices tab

1. Log in as `ardit@demo.al`, go to Profile → My Devices
2. Show the registered device entry (hash, country, last seen)
3. Point out the **GDPR Art. 17 right to erasure** card at the bottom
4. Say: "Removing a device deletes the hash from our system. Risk events linked to it
   are purged within 90 days. This is the right to erasure in practice."

**Bonus — show the consent modal again:**
- Open Send page in a fresh Incognito window
- Show the full GDPR modal before any data is collected
- Point out: "We don't collect anything until you explicitly accept.
  If you decline, the device is treated as unknown — we tell you that upfront."

📸 **Screenshot**: My Devices tab with the GDPR erasure card  
📸 **Screenshot**: Privacy consent modal (full view)

---

## Talking Points Cheat Sheet

**On the fraud engine:**
> "9 signals, all weighted, score capped at 100. The thresholds map to 5 actions.
> It's deterministic — same inputs, same output, fully auditable."

**On GDPR:**
> "Legal basis is Art. 6(1)(f) — legitimate interest in fraud prevention.
> We hash everything client-side before it leaves the browser. We store a country code,
> not a coordinate. And the user can delete all of it, anytime."

**On biometrics:**
> "WebAuthn. The private key lives in the device's secure enclave.
> We store the public key and a counter. That's it. No face data, no fingerprint data — ever."

**On PSD2:**
> "Strong Customer Authentication has two factors: something you know (PIN) and
> something you are (biometric). We implement both, triggered dynamically by risk score."

**On the admin queue:**
> "Score ≥ 90 means a human looks at it. Article 22 GDPR says automated decisions
> with significant effect require human review. Ours does."

**On cooling-off:**
> "Inspired by UK FCA guidance on authorized push payment fraud. A mandatory delay
> lets the account holder catch unauthorized transfers before funds move."

---

## If Something Breaks

| Problem | Fix |
|---|---|
| Biometric fails | Skip it, show the page, cancel — the UX explanation is the demo |
| DB inconsistent | `npx prisma db push --force-reset && npm run seed` |
| Wrong risk score | Use the flag table — double-check device hash and country detection |
| Admin queue empty | Manually trigger the Ivan €20,000 transfer from Incognito |
| Can't log in | All passwords are `Demo123!`, PIN is `1234` |

---

## Accounts Quick Reference

| Email | Password | PIN | Country | Use for |
|---|---|---|---|---|
| `ardit@demo.al` | Demo123! | 1234 | AL | Main demo user |
| `giulia@demo.it` | Demo123! | 1234 | IT | Secondary sender |
| `hans@demo.de` | Demo123! | 1234 | DE | Safe recipient |
| `ivan@demo.ru` | Demo123! | 1234 | RU | HIGH_RISK_COUNTRY target |
| `sara@demo.us` | Demo123! | 1234 | US | LOCATION_MISMATCH target |
| `admin@vaultis.al` | Admin123! | — | — | Admin panel |

---

*Vaultis · CIT Hackathon 2026 · Not a real bank*
