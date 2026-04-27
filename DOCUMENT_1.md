# DOCUMENT 1 — AUTHENTICATION MODULE

**Scope:** User model, Admin users, Auth middleware + controller + routes, backend entry file, password strength, OTP verification (registration + password reset), promo code system (bonus-at-25-users), forgot/reset password flow, frontend API client + services + hooks, auth UI components (Login, Register, OTP Verify, Forgot Password, Reset Password), theme system (dark/light), and `useResponsive` hook.

**Target stack:**
- Backend: Node.js + Express + Mongoose (**JavaScript**)
- Frontend: Next.js (App Router) + **TypeScript** + Tailwind CSS

---

## SECTION A — ANALYSIS OF PRIMEBITTRADE-STYLE AUTH FLOWS

### A.1 What the reference site does (from public info + industry patterns)

PrimeBit-style platforms (primebit.com, primebittrade.com, PrimeXBT, and similar "simplified interface" crypto exchanges) share a near-identical authentication pattern:

1. **Registration** is minimal — email, password, optional referral code. Some skip KYC at signup entirely.
2. **Email verification** is done either via:
   - A link emailed to the user (older pattern — what your current backend does), OR
   - A **6-digit numeric OTP** emailed to the user, entered on a dedicated OTP screen (newer pattern — what modern exchanges like Binance, Bybit, OKX, and Bitget use).
3. **Login** is email + password, with optional 2FA via authenticator app (we won't build 2FA in this module — it's a future enhancement).
4. **Forgot password** flow: user enters email → OTP is sent → user enters OTP → user is taken to a reset-password screen → new password is set.
5. **Referral / promo codes** are common at signup. They're stored on the user record, and bonuses unlock at milestones (e.g., "bonus unlocked when 25 people sign up with your code"). This is exactly the pattern you described.
6. **Account freezing** is a common admin control (your `isFrozen` + `freezeReason` fields on `User` already match this).
7. **Password strength** is enforced client-side (live strength meter) and re-validated server-side. Industry minimum: 8 chars, uppercase + number + special character.

### A.2 What your current backend already has (strengths)

Reading `/mnt/project/User.js`, `authController.js`, `auth.js`, `validate.js`, `rareLimiter.js`:

- **User model** already has email verification fields, password reset fields, refresh-token hashing, account freeze, KYC tier/status, and admin-controlled `autoMode`. Solid foundation.
- **authController.js** already does: register, verify-email (link-based), login, refresh, forgot-password, reset-password, logout. Tokens use JWT access (15m) + refresh (7d), refresh token stored bcrypt-hashed.
- **validate.js** already enforces password strength (8+ chars, uppercase, number, special char) via Zod.
- **rareLimiter.js** already has strict limits: 10 login attempts / 15 min, 5 registrations / hour, 100 general / min.

### A.3 What needs to change (gap analysis)

| Current | Target | Action |
|---|---|---|
| 24-hour **link-based** email verification | 6-digit **OTP-based** verification (10 min expiry, 3 attempts max) | Rewrite verify flow; add OTP fields to User; add `verify-otp` + `resend-otp` endpoints |
| Forgot password uses a **link** | Forgot password uses **OTP → reset page** (3-step flow) | Rewrite forgot-password flow; add `verify-reset-otp` endpoint that returns a short-lived reset token |
| No promo code / referral system | `PromoCode` model, usage tracking, bonus unlocked at 25 signups | Create new model + controller + routes |
| No admin seeding | One or more seeded admin users on first boot | Add `scripts/seedAdmin.js` run on startup if no admin exists |
| No frontend yet | Next.js 14 App Router, TS, Tailwind, auth pages, `useResponsive` hook, theme provider | Full frontend build |

### A.4 Security & correctness notes I want to fix while we're here

- **OTP storage:** OTPs are stored on the User record as a **bcrypt hash** — never as plaintext. Attempts counter is also stored on the User record.
- **OTP cooldown:** After requesting an OTP, the user cannot request another for 60 seconds (prevents email spam).
- **Rate limiting on OTP verify:** 3 attempts per OTP, then the OTP is invalidated. A new OTP must be requested.
- **Forgot-password reset token:** After the user verifies the forgot-password OTP, the server issues a short-lived (10 min) one-time reset token (JWT or random hex). The new-password endpoint requires this token — users can't just hit `/reset-password` directly.
- **Enumeration safety:** Forgot-password always returns success even if email doesn't exist (your current code already does this — keep it).
- **Promo code uniqueness:** Codes are uppercase, 6–12 chars, unique indexed. A user applies a code at signup; the code's owner gets +1 to their `referralCount`. When `referralCount` hits 25, a `bonusUnlocked: true` flag is set (the actual bonus-crediting logic is a clearly-marked TODO for later).

---

## SECTION B — IMPLEMENTATION GUIDE (STEP-BY-STEP)

### B.1 Backend file layout (additions / changes to your current structure)

```
backend/
├── index.js                          ← NEW: entry file (replaces any ad-hoc app.js)
├── config/
│   ├── db.js                         ← Mongoose connection
│   └── env.js                        ← env var validation (fail-fast on boot)
├── models/
│   ├── User.js                       ← UPDATE: add OTP fields, referral fields
│   ├── PromoCode.js                  ← NEW
│   └── (existing models unchanged)
├── controllers/
│   ├── authController.js             ← REWRITE: OTP-based flow
│   ├── promoController.js            ← NEW
│   └── (existing controllers unchanged)
├── routes/
│   ├── auth.js                       ← NEW (split out of authController)
│   ├── promo.js                      ← NEW
│   └── (existing routes unchanged)
├── middleware/
│   ├── auth.js                       ← keep as-is
│   ├── isAdmin.js                    ← keep as-is
│   ├── validate.js                   ← UPDATE: add OTP schemas
│   ├── rareLimiter.js                ← UPDATE: add OTP-specific limiter
│   └── upload.js                     ← keep as-is
├── services/
│   ├── emailService.js               ← UPDATE: OTP email templates
│   └── otpService.js                 ← NEW: generate/hash/verify OTPs
├── scripts/
│   └── seedAdmin.js                  ← NEW: runs on boot, creates admin if none exists
└── uploads/                          ← existing
```

### B.2 User model — updated fields (additions only)

Add these fields to the existing `UserSchema`:

```js
// ── OTP (registration + password reset share this) ──
otpHash:        { type: String },       // bcrypt hash of the 6-digit code
otpExpires:     { type: Date },
otpPurpose:     { type: String, enum: ['email_verification', 'password_reset'] },
otpAttempts:    { type: Number, default: 0 },
otpLastSentAt:  { type: Date },         // for 60s cooldown

// ── Password reset (replace link with short-lived token issued after OTP) ──
// You already have passwordResetToken + passwordResetExpires — keep them.
// They now store the token returned AFTER successful OTP verification.

// ── Referral / promo ──
promoCodeUsed:    { type: String, uppercase: true, trim: true },    // the code THIS user signed up with
ownPromoCode:     { type: String, uppercase: true, trim: true, unique: true, sparse: true }, // the code THIS user owns
referralCount:    { type: Number, default: 0 },
bonusUnlocked:    { type: Boolean, default: false },
bonusCreditedAt:  { type: Date },       // null until bonus-crediting logic runs (future TODO)
```

### B.3 PromoCode model (new)

Lightweight — most state lives on User. This model lets admins pre-create codes, track usage aggregates, and disable codes.

```js
// models/PromoCode.js
const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 6, maxlength: 12 },
  ownerUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = system-generated
  usageCount:   { type: Number, default: 0 },
  isActive:     { type: Boolean, default: true },
  bonusThreshold: { type: Number, default: 25 },   // signups needed to unlock bonus
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);
```

### B.4 OTP service (new) — `services/otpService.js`

Single source of truth for OTP generation and verification. Keeps controllers clean.

```js
// services/otpService.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;   // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;

// Cryptographically secure 6-digit numeric code
function generateOtp() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(OTP_LENGTH, '0');
}

async function issueOtp(user, purpose) {
  // Cooldown check
  if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - user.otpLastSentAt.getTime())) / 1000);
    const err = new Error(`Please wait ${waitSec}s before requesting another code.`);
    err.statusCode = 429;
    throw err;
  }

  const otp = generateOtp();
  user.otpHash = await bcrypt.hash(otp, 8);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpPurpose = purpose;
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();
  return otp; // plaintext returned to caller ONLY so it can be emailed — never stored/logged
}

async function verifyOtp(user, submittedOtp, expectedPurpose) {
  if (!user.otpHash || !user.otpExpires || user.otpPurpose !== expectedPurpose) {
    const err = new Error('No active code. Please request a new one.');
    err.statusCode = 400; throw err;
  }
  if (user.otpExpires.getTime() < Date.now()) {
    const err = new Error('Code expired. Please request a new one.');
    err.statusCode = 400; throw err;
  }
  if (user.otpAttempts >= MAX_ATTEMPTS) {
    clearOtp(user);
    await user.save();
    const err = new Error('Too many incorrect attempts. Please request a new code.');
    err.statusCode = 429; throw err;
  }

  const ok = await bcrypt.compare(submittedOtp, user.otpHash);
  if (!ok) {
    user.otpAttempts += 1;
    await user.save();
    const remaining = MAX_ATTEMPTS - user.otpAttempts;
    const err = new Error(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    err.statusCode = 400; throw err;
  }

  // success — clear OTP
  clearOtp(user);
  await user.save();
  return true;
}

function clearOtp(user) {
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  user.otpAttempts = 0;
  user.otpLastSentAt = undefined;
}

module.exports = { issueOtp, verifyOtp, clearOtp, OTP_TTL_MS, MAX_ATTEMPTS };
```

### B.5 Auth controller — endpoint list

After rewrite, `authController.js` exposes:

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create user (unverified), apply promo code if present, issue OTP, email it |
| POST | `/api/auth/verify-otp` | Verify registration OTP → mark email verified |
| POST | `/api/auth/resend-otp` | Resend registration OTP (cooldown enforced) |
| POST | `/api/auth/login` | Email + password → returns `{accessToken, refreshToken, user}` |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Email → issues OTP, emails it (always returns success) |
| POST | `/api/auth/verify-reset-otp` | Email + OTP → returns short-lived `resetToken` |
| POST | `/api/auth/reset-password` | `resetToken` + `newPassword` → updates password, invalidates all sessions |
| POST | `/api/auth/logout` | Clears stored refresh token |

### B.6 Promo controller — endpoint list

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/promo/validate/:code` | public | Check if a promo code is valid (during registration) |
| GET | `/api/promo/me` | user | Current user's own code + referralCount + bonusUnlocked |
| POST | `/api/promo/generate` | user | Generate the current user's own promo code (idempotent) |
| GET | `/api/promo/admin/all` | admin | List all codes with usage |
| PATCH | `/api/promo/admin/:code` | admin | Toggle `isActive`, adjust `bonusThreshold` |

### B.7 Entry file — `index.js`

```js
// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const { apiLimiter } = require('./middleware/rareLimiter');
const seedAdmin = require('./scripts/seedAdmin');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

app.use('/api', apiLimiter);

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/user',     require('./routes/user'));
app.use('/api/promo',    require('./routes/promo'));
app.use('/api/funds',    require('./routes/funds'));
app.use('/api/deposit',  require('./routes/deposit'));
app.use('/api/kyc',      require('./routes/kyc'));
app.use('/api/prices',   require('./routes/prices'));
app.use('/api/trade',    require('./routes/trade'));
app.use('/api/support',  require('./routes/support'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI).then(async () => {
  await seedAdmin();
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
}).catch((e) => { console.error('DB connect failed:', e); process.exit(1); });
```

### B.8 Frontend file layout (Next.js App Router + TypeScript)

```
frontend/
├── app/
│   ├── layout.tsx                    ← ThemeProvider, QueryProvider, Toaster
│   ├── page.tsx                      ← marketing landing (pre-login)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   └── (app)/                        ← authenticated routes (added in Doc 2)
├── components/
│   ├── ui/                           ← primitives: Button, Input, Card, Modal, Toast, Spinner
│   ├── auth/
│   │   ├── AuthLayout.tsx            ← split-screen auth layout
│   │   ├── PasswordStrengthMeter.tsx
│   │   ├── OtpInput.tsx              ← 6-box OTP input with paste support
│   │   ├── FormField.tsx
│   │   └── AuthHeader.tsx
│   └── theme/
│       ├── ThemeProvider.tsx         ← dark/light/system
│       └── ThemeToggle.tsx
├── hooks/
│   ├── useResponsive.ts              ← mobile/tablet/desktop breakpoints
│   ├── useAuth.ts                    ← token mgmt + current user
│   └── useCountdown.ts               ← for OTP resend cooldown UI
├── services/
│   ├── apiClient.ts                  ← axios instance w/ interceptors (refresh on 401)
│   ├── authService.ts                ← all /api/auth calls
│   └── promoService.ts               ← all /api/promo calls
├── lib/
│   ├── tokens.ts                     ← design tokens (colors/spacing/radius)
│   └── validators.ts                 ← Zod schemas mirroring backend
├── types/
│   └── auth.ts                       ← User, AuthResponse, OtpPurpose, etc.
└── tailwind.config.ts                ← theme extension with CSS vars
```

### B.9 Design system — theme approach (dark + light)

Trading platforms universally share a visual vocabulary: dark-first interfaces, **green for buy/up** and **red for sell/down**, high-contrast numeric displays, deep neutral backgrounds, and one strong accent. We'll model ours on that vocabulary (Bybit/Bitget/OKX lineage) without copying any specific brand.

**Color tokens (CSS vars, switched by `[data-theme]` attribute):**

```css
:root[data-theme='dark'] {
  --bg-base: #0B0E11;           /* page background */
  --bg-elevated: #161A1E;       /* cards, modals */
  --bg-muted: #1E2329;          /* inputs, table rows */
  --border: #2B3139;
  --text-primary: #EAECEF;
  --text-secondary: #848E9C;
  --text-muted: #5E6673;
  --accent: #F0B90B;            /* brand gold/yellow */
  --accent-hover: #F8D12F;
  --success: #0ECB81;           /* buy / up */
  --danger: #F6465D;            /* sell / down */
  --info: #1890FF;
  --warning: #FFA500;
}
:root[data-theme='light'] {
  --bg-base: #FFFFFF;
  --bg-elevated: #F5F7FA;
  --bg-muted: #EAECEF;
  --border: #D7DCE0;
  --text-primary: #1E2329;
  --text-secondary: #474D57;
  --text-muted: #848E9C;
  --accent: #F0B90B;
  --accent-hover: #D9A607;
  --success: #0ECB81;
  --danger: #F6465D;
  --info: #1890FF;
  --warning: #FFA500;
}
```

Tailwind config maps these to utility classes (`bg-base`, `text-primary`, `border-border`, etc.) so components are theme-agnostic.

### B.10 `useResponsive` hook contract

```ts
// hooks/useResponsive.ts
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export function useResponsive(): {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
};
```

Breakpoints: `mobile < 768`, `tablet 768–1023`, `desktop ≥ 1024`. SSR-safe (returns `desktop` during SSR, updates on hydration).

### B.11 Auth pages — screen-by-screen flow

1. **Register** → name, email, password (with live strength meter), country, optional promo code → submit → redirect to `/verify-otp?email=...&purpose=email_verification`
2. **Verify OTP** → 6-box OTP input, 10-min countdown, "Resend code" (60s cooldown) → on success: redirect to `/login` with toast "Account verified, please log in"
3. **Login** → email + password → on success: store tokens, redirect to `/dashboard` (handled in Doc 2)
4. **Forgot Password** → email → submit → redirect to `/verify-otp?email=...&purpose=password_reset`
5. **Verify Reset OTP** (same component as #2, different purpose) → on success: receive `resetToken`, redirect to `/reset-password?token=...`
6. **Reset Password** → new password (with strength meter) + confirm → submit → redirect to `/login`

---

## SECTION C — REFERENCE FILES TO ATTACH TO CLAUDE

When you paste the prompts below into a Claude session, attach these files from your project so Claude has ground truth:

**Backend (required):**
- `/mnt/project/User.js` — current user model (schema to extend)
- `/mnt/project/authController.js` — current auth controller (to rewrite)
- `/mnt/project/auth.js` — auth middleware (keep as-is, Claude should preserve it)
- `/mnt/project/validate.js` — validation schemas (to extend with OTP schemas)
- `/mnt/project/rareLimiter.js` — rate limiters (to extend)
- `/mnt/project/isAdmin.js` — admin middleware (reference)
- `/mnt/project/upload.js` — multer config (reference for style consistency)

**Plus this document** (`DOCUMENT_1_Authentication_Module.md`).

**Frontend:** no existing frontend files to attach — this is a fresh Next.js build.

---

## SECTION D — PROMPT #1: BACKEND + FRONTEND SERVICES

> Copy-paste this into a new Claude conversation along with the files listed in Section C.

```
I'm building the authentication module for a crypto trading platform clone (inspired by primebittrade.com). My stack is:
- Backend: Node.js + Express + Mongoose (JavaScript, NOT TypeScript)
- Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS

I've attached my CURRENT backend files and a design document (DOCUMENT_1_Authentication_Module.md). Read the document fully — it is the spec. The existing files show my code style and what to preserve.

Build the COMPLETE authentication module end-to-end. Produce every file fully written out (no "..." placeholders, no "add this here" comments).

## BACKEND — deliver these files:

1. `models/User.js` — EXTEND my existing schema with the OTP fields, referral fields, and bonus fields exactly as specified in Section B.2. Keep every existing field.
2. `models/PromoCode.js` — per Section B.3.
3. `services/otpService.js` — per Section B.4, word-for-word.
4. `services/emailService.js` — nodemailer-based, with two templates: OTP for email verification, OTP for password reset. Clean HTML, the brand name "PrimeBitTrade Clone" (placeholder), the 6-digit code shown large and centered, and an expiry notice. Must export `sendOtpEmail(email, otp, purpose)`.
5. `controllers/authController.js` — FULL REWRITE implementing all 9 endpoints in Section B.5. OTP flow, not link-based. On registration, if `promoCode` is provided in the body, validate it against PromoCode collection (must exist + isActive), set `promoCodeUsed` on the new user, increment the owner's `referralCount`, and set `bonusUnlocked=true` if threshold hit. Use my existing JWT patterns (15m access, 7d refresh, refresh stored as bcrypt hash).
6. `controllers/promoController.js` — per Section B.6. Own-code generation: 8 uppercase alphanumeric chars, uniqueness-checked in a loop.
7. `middleware/validate.js` — EXTEND my existing file with: `verifyOtpSchema`, `resendOtpSchema`, `verifyResetOtpSchema`, `resetPasswordWithTokenSchema`, `registerSchema` (extend to include optional `promoCode`).
8. `middleware/rareLimiter.js` — ADD `otpVerifyLimiter` (5 attempts per 10 min per IP) and `otpResendLimiter` (3 per 10 min per IP). Keep existing limiters.
9. `routes/auth.js` — mount all 9 auth endpoints with the correct middleware (validate + rate limiters).
10. `routes/promo.js` — mount promo endpoints.
11. `index.js` — per Section B.7.
12. `scripts/seedAdmin.js` — on boot, if no user with role='admin' exists, create one from env vars `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`. Email pre-verified. Log a warning if env vars missing.
13. `.env.example` — list every env var the backend uses.

## FRONTEND — deliver these files (TypeScript, no `any`):

1. `services/apiClient.ts` — axios instance. Base URL from `NEXT_PUBLIC_API_URL`. Request interceptor: attach access token from localStorage. Response interceptor: on 401, try refresh-token endpoint once; on success retry the original request, on failure clear tokens and redirect to /login.
2. `services/authService.ts` — typed functions for every auth endpoint: `register`, `verifyOtp`, `resendOtp`, `login`, `forgotPassword`, `verifyResetOtp`, `resetPassword`, `logout`, `refresh`.
3. `services/promoService.ts` — `validatePromo(code)`, `getMyPromo()`, `generateMyPromo()`.
4. `hooks/useAuth.ts` — React Query-based. Exposes `user`, `isLoading`, `isAuthenticated`, `login`, `logout`, `register`. Persists tokens to localStorage. On mount, if access token present, fetches `/api/user/profile` to hydrate user.
5. `hooks/useCountdown.ts` — takes a seconds number, returns `{secondsLeft, isDone, restart}`.
6. `types/auth.ts` — `User`, `AuthResponse`, `OtpPurpose = 'email_verification' | 'password_reset'`, `RegisterPayload`, etc.
7. `lib/validators.ts` — Zod schemas mirroring backend validation for all auth forms.

## Non-negotiables
- Every file must be production-grade, complete, and runnable.
- Preserve my existing code style exactly (2-space indent, section-comment dividers, the `// ── NAME ──` header pattern, `try/catch` with `console.error` + 500 response).
- No TODOs left behind EXCEPT one: in the promo-code bonus-credit logic, leave a clearly-marked `// TODO: credit bonus to user balance — implement in a later phase` comment. The flag flip happens now; the money move is later.
- Don't skip small files like `.env.example` and `seedAdmin.js`.
- Use the exact token names from Section B.9 in Tailwind config (but full Tailwind setup is in Prompt #2).

Start with the backend files in order, then the frontend files. Confirm at the end which files you produced.
```

---

## SECTION E — PROMPT #2: CLAUDE DESIGN MODE — THEME + UI + AUTH PAGES

> Use this prompt in a **new conversation** in **Claude Design mode**. Attach this document and the output from Prompt #1's frontend (apiClient, authService, hooks, types) if you have them.

```
Claude Design mode: I'm building the UI for a crypto trading platform clone inspired by primebittrade.com, Bybit, and Bitget. Stack: Next.js 14 App Router + TypeScript + Tailwind CSS. I already have services, hooks, and types built — your job is ONLY the theme system, reusable UI components, and the 5 authentication pages.

Attached: DOCUMENT_1_Authentication_Module.md. Read it fully — Sections B.8, B.9, B.10, and B.11 are the spec.

## Design direction — crypto-trading-platform visual language
- Dark-first interface, light theme available via toggle
- Color tokens from Section B.9 (CSS variables) — implement EXACTLY these hex values
- Green (#0ECB81) = up/buy/success, Red (#F6465D) = down/sell/danger
- Accent yellow (#F0B90B) for primary CTAs and brand moments
- Dense, data-forward typography (Inter or IBM Plex Sans)
- Generous vertical rhythm, tight horizontal density
- Rounded corners: inputs/buttons 8px, cards 12px, modals 16px
- Micro-interactions: subtle scale-on-press for buttons, gentle fade/slide for route transitions
- NO glassmorphism, NO gradients-everywhere, NO playful illustrations — this is a finance tool

## Deliverables (all TypeScript, all fully written out)

### 1. Theme system
- `app/layout.tsx` — ThemeProvider wrapping the app, font loading (Inter), `<body>` with `data-theme` attribute
- `components/theme/ThemeProvider.tsx` — context with `theme: 'dark' | 'light' | 'system'`, `setTheme`, hydration-safe, localStorage persistence
- `components/theme/ThemeToggle.tsx` — icon button that cycles dark → light → system
- `tailwind.config.ts` — extend theme with CSS-var-backed colors: `base`, `elevated`, `muted`, `border`, `text-primary`, `text-secondary`, `text-muted`, `accent`, `success`, `danger`, `info`, `warning`. Map to the CSS vars so both themes work.
- `app/globals.css` — the `:root[data-theme='dark']` and `[data-theme='light']` blocks from Section B.9

### 2. `hooks/useResponsive.ts`
Per Section B.10 exactly. SSR-safe. Uses `matchMedia` + resize listener, debounced.

### 3. General UI primitives (`components/ui/`)
Build these as the foundation for every screen in this module AND future modules:
- `Button.tsx` — variants: `primary` (accent bg), `secondary` (elevated bg + border), `ghost` (text only), `danger` (red bg); sizes: `sm`, `md`, `lg`; `loading` state with spinner; full `disabled` styling; `icon` prop for leading/trailing icons
- `Input.tsx` — label, helper text, error text, leading/trailing icon slots, `showPasswordToggle` for password inputs
- `Card.tsx` — elevated background, border, rounded-xl, optional header/footer slots
- `Modal.tsx` — portal-based, backdrop blur, close on Esc/backdrop-click, focus trap, animated enter/exit
- `Spinner.tsx` — 3 sizes
- `Toast.tsx` + `ToastProvider.tsx` — react-hot-toast or sonner, themed to match
- `Select.tsx` — for country dropdown (use a searchable variant)
- `Divider.tsx`, `Skeleton.tsx`

All primitives consume theme via CSS vars — no hardcoded colors.

### 4. Auth-specific components (`components/auth/`)
- `AuthLayout.tsx` — split-screen layout: LEFT side shows brand, a muted crypto market visual (candlestick chart background, very subtle, low opacity — SVG or lottie, not a heavy image), and a short headline ("Trade crypto, the simple way"); RIGHT side is the form in a centered Card. On mobile (<768px), layout collapses to single column, brand becomes a compact header.
- `PasswordStrengthMeter.tsx` — 4 segments filling as strength increases (weak / fair / good / strong). Checks: length ≥ 8, has uppercase, has number, has special char. Show a small checklist below with green/gray check marks. Color segments: red → orange → yellow → green.
- `OtpInput.tsx` — 6 separate boxes, auto-focus next on digit, backspace moves to prev, paste spreads across boxes, only accepts 0-9. Shows invalid state via red border shake.
- `FormField.tsx` — wrapper combining label + Input + error message with consistent spacing
- `AuthHeader.tsx` — logo + "Back to home" link

### 5. Auth pages (`app/(auth)/*/page.tsx`)
Use my `authService` and `useAuth` hook (already built). All forms use react-hook-form + zod (schemas from `lib/validators.ts`).

- `login/page.tsx` — email, password, "Forgot password?" link, submit button, "Don't have an account? Sign up" link, optional "Remember me" checkbox (persists refresh token longer — leave as UI-only for now)
- `register/page.tsx` — name, email, password with live strength meter, country (searchable select), optional promo code field (with inline validation: greys out, then shows ✓ "Valid code" in green if found, or ✗ "Invalid code" in red). Submit → redirect to `/verify-otp?email=<email>&purpose=email_verification`
- `verify-otp/page.tsx` — reads email + purpose from query params. Large OtpInput. 10-min expiry countdown displayed ("Code expires in 9:42"). "Didn't receive the code? Resend" button, disabled with 60s cooldown (use `useCountdown`). On success: if purpose=email_verification → redirect `/login` with success toast; if purpose=password_reset → receive resetToken, redirect `/reset-password?token=<resetToken>`
- `forgot-password/page.tsx` — email field, submit, success toast "If that email is registered, a code has been sent", redirect `/verify-otp?email=<email>&purpose=password_reset`
- `reset-password/page.tsx` — reads `token` from query, new password (with strength meter) + confirm password, submit → redirect `/login` with success toast. If token invalid/expired, show error state with "Request a new link" button returning to `/forgot-password`

## Non-negotiables
- Pixel-tight spacing and alignment — this needs to look like a real exchange, not a tutorial
- Full keyboard navigation on every form (Tab order, Enter submits, Esc closes modals)
- Every screen responsive: test implicitly at 360px, 768px, 1280px widths using `useResponsive`
- Dark + light both polished — do not treat light theme as an afterthought
- Error states visible and helpful — show server error messages from the API inline, not just as toasts
- Loading states on every submit button (disabled + spinner)
- No placeholder images that won't exist — use pure CSS / inline SVG for any decorative visuals

Deliver every file fully. List the final file tree at the end.
```

---

## SECTION F — ACCEPTANCE CHECKLIST (how to know this module is done)

- [ ] User can register with name/email/password/country + optional promo code
- [ ] 6-digit OTP email arrives within ~10 seconds of registration
- [ ] Entering correct OTP verifies the email and redirects to login
- [ ] Entering incorrect OTP 3 times invalidates it and forces a resend
- [ ] Resend button disabled for 60s after being pressed
- [ ] Login succeeds only if email is verified; frozen users get a clear error
- [ ] Forgot-password flow works end-to-end: email → OTP → new password → login
- [ ] Promo code `INVALID` shows red ✗, `VALIDCODE` shows green ✓ in registration
- [ ] When 25 users sign up with a code, `bonusUnlocked` flips to `true` on the owner (TODO note present for actual credit logic)
- [ ] Seed admin user exists on first boot from env vars
- [ ] Dark/light theme toggle works, persists across reloads
- [ ] All 5 auth pages render correctly at 360px, 768px, 1280px
- [ ] Access-token refresh happens silently on 401 without logging user out

---

**End of Document 1.** Documents 2 and 3 will be generated next.