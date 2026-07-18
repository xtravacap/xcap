# Xtrava Capital — Lender Matching Platform

A production-quality platform for a commercial real estate capital advisory firm to manage lender
relationships, take borrower loan requests, and automatically score/rank every lender program against
every deal.

- **Admins** manage the lender database, review borrower submissions, override matches, and track pipeline analytics.
- **Lenders** self-manage their profile, loan programs, and see referrals Xtrava sends them.
- **Borrowers** submit a financing request, upload documents, and track status through close.
- A **matching engine** scores every loan request against every active lender program (0–100) with
  human-readable match/warning/disqualifier reasons.
- **AI (OpenAI)** extracts structured data from uploaded borrower documents and lender guideline
  matrices (PDF/Excel/Word/CSV), auto-populating the borrower profile and lender loan programs.

---

## Tech stack

| Layer          | Choice                                                          |
| -------------- | ---------------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4  |
| UI components  | shadcn/ui (hand-rolled from source — see note below), Radix UI, Recharts |
| Forms          | React Hook Form + Zod                                            |
| Backend        | Next.js Route Handlers (App Router `/api`)                       |
| ORM / Database | Prisma 6 + PostgreSQL                                             |
| Auth           | Clerk (`@clerk/nextjs`) — role stored on our own `User` row       |
| File storage   | Supabase Storage                                                  |
| AI             | OpenAI (Responses API, structured outputs via Zod schemas)       |
| Email          | Resend (falls back to console logging if unconfigured)           |
| Testing        | Vitest + Testing Library                                          |
| Deployment     | Vercel (app) — see [Deployment](#deployment)                     |
| Local infra    | Docker Compose (Postgres + app)                                  |

> **Note on shadcn/ui:** the `shadcn` CLI's registry (`ui.shadcn.com`) wasn't reachable from this build
> environment, so the primitives in `src/components/ui/*` were hand-written to match shadcn's own
> source/conventions (Radix + `class-variance-authority` + `tailwind-merge`) instead of running
> `npx shadcn add ...`. They are drop-in compatible if you later run the CLI against these files.

---

## Folder structure

```
prisma/
  schema.prisma          # Full data model (see below)
  seed.ts                 # Realistic demo dataset (10 lenders, 16 programs, 8 borrowers, matches)
  migrations/

src/
  app/
    (auth)/sign-in, sign-up        # Clerk auth pages
    (dashboard)/                   # Authenticated app shell
      dashboard/                  # Role-aware dashboard (admin/lender/borrower widgets)
      borrowers/[id]               # Admin: borrower profile + their loan requests
      lenders/, lenders/[id]       # Lender database CRUD + loan programs + guideline uploads
      loan-programs/               # Loan program CRUD (admin + lender self-service)
      loan-requests/[id]           # Full deal detail: matches, documents, comments, status
      matches/                     # Ranked matches (role-scoped: admin/lender/borrower views)
      documents/                   # Org-wide document list + AI extraction status
      analytics/                   # Pipeline, conversion, top lenders/states/asset classes
      settings/                    # Account + role-specific settings
      apply/                       # Borrower intake form (multi-section) + document upload
    api/                            # Route handlers — one folder per resource
      lenders/, loan-programs/, borrowers/, loan-requests/, matches/, documents/,
      comments/, notifications/, analytics/, search/, webhooks/clerk/
  components/
    ui/                             # shadcn-style primitives (button, card, dialog, table, ...)
    dashboard/, lenders/, loan-programs/, borrowers/, loan-requests/, matches/,
    documents/, intake/, analytics/, settings/, search/, forms/
  lib/
    matching/
      engine.ts                    # Pure scoring function + ranking (fully unit-tested)
      mappers.ts                   # Prisma row -> engine input adapters
      run.ts                       # Orchestrates a full matching pass + persists Match rows
    ai/
      extract-loan-document.ts     # OpenAI extraction for borrower documents
      parse-lender-guidelines.ts   # OpenAI extraction for lender loan matrices
      apply-extraction.ts          # Downloads from storage, extracts, patches LoanRequest
      enum-mapping.ts              # Free-text -> Prisma enum keyword mapping
    storage/supabase.ts             # Supabase Storage upload/signed-url/delete
    email/send.ts                  # Resend wrapper (+ HTML email shell)
    validation/                    # Zod schemas (shared by API routes + forms)
    notify.ts                       # Notification + email triggers for the 5 required events
    analytics.ts                    # Shared analytics aggregation (dashboard + /analytics page)
    search/parse-query.ts           # "Bridge lenders in NJ" -> Prisma filter (unit-tested)
    auth.ts, api-utils.ts            # Auth guards + consistent API error handling
  hooks/
    use-debounced-value.ts          # Used by the search command palette

Dockerfile, docker-compose.yml, .env.example
```

---

## Data model

See `prisma/schema.prisma` for the full, commented schema. Highlights:

- **`Organization`** exists from day one (multi-tenant-ready) — every tenant-scoped model carries an
  `organizationId`, even though a single "Xtrava Capital" org is seeded today.
- **`User`** stores `role` (`ADMIN | LENDER | BORROWER`) and optionally links 1:1 to a `Lender` or
  `Borrower` profile. Synced from Clerk via the `/api/webhooks/clerk` webhook.
- **`Lender`** has both tag arrays (`loanTypes`, `propertyTypes`, `states` — for search) *and* explicit
  boolean capability flags (`allowsBridge`, `allowsDscr`, ... `allowsLand`) that mirror the exact
  checklist requested for the lender profile UI. Also carries every requirement field (min credit,
  DSCR, LTV/LTC, sponsor net worth, liquidity, entity requirements, prepayment, closing timeline...).
- **`LoanProgram`** is the actual unit the matching engine compares against — unlimited programs per
  lender, each with its own box (amount range, DSCR/LTV/LTC, rate range, term, property types, states,
  and the Bridge/Permanent/Construction/Value-Add/Ground-Up/Fix&Flip/Rental-Portfolio/Commercial/
  Residential flags from the spec).
- **`Borrower` / `LoanRequest`** — the intake. All fields from the spec (experience, credit, liquidity,
  net worth, LTV/LTC/DSCR/NOI/cap rate, purpose, timeline, exit strategy, recourse preference, ...).
- **`Match`** — one row per `(LoanRequest, LoanProgram)`, with `lenderId` denormalized for fast
  lender-level queries/indexes. Stores `score`, `reasons` (JSON: matches/warnings/disqualifiers),
  `status`, and admin override metadata.
- **`Document`** — Supabase Storage pointer + AI `extractionStatus`/`extractedData`, attachable to a
  `LoanRequest` (borrower docs) or a `Lender` (guideline matrices).
- **`Comment`, `Notification`, `ActivityLog`** — collaboration + the "recent activity" / notifications
  feed.

---

## The matching engine

`src/lib/matching/engine.ts` is a **pure function** (no I/O) so it's fully unit-testable
(`engine.test.ts`, 8 cases) and safe to run either server-side (API route / seed script) or offline.

For a given `(LoanRequest, Lender, LoanProgram)` triple it scores 14 weighted criteria — state,
property type, loan amount, DSCR, LTV, LTC, credit score, liquidity, sponsor experience, loan purpose,
loan-type capability (Bridge/DSCR/Construction/... flags), asset class (commercial vs. residential),
closing timeline, and recourse preference — and returns:

```ts
{ score: 0-100, eligible: boolean, matches: string[], warnings: string[], disqualifiers: string[] }
```

- **Hard criteria** (state, property type, loan amount, purpose, loan-type capability) that fail
  disqualify the match and cap its score at 30, even if every soft criterion is perfect — a lender that
  structurally can't do the deal shouldn't rank near the top.
- **Soft criteria** (credit score, DSCR, LTV/LTC, liquidity, experience, timeline, recourse) degrade the
  score gradually and show up as ⚠ warnings rather than hard failures — matching the spec's
  "still eligible" example (74%, credit slightly below preference).

`src/lib/matching/run.ts` runs the engine against every active program from every active lender in the
org, upserts `Match` rows (preserving any admin override on re-run), flips the loan request to
`MATCHED`, logs activity, and notifies lenders whose score crosses 70%.

---

## AI features

- **Borrower document extraction** (`lib/ai/extract-loan-document.ts`): PDFs/images are sent directly
  to OpenAI's Responses API (native file/vision input); Word/Excel/CSV are converted to text first
  (`mammoth` / `xlsx`) then sent as text. Uses a Zod schema + `zodTextFormat` for structured output
  (purchase price, address, NOI, DSCR, LTV, cap rate, rent roll summary, sponsor info, loan amount).
  Runs automatically after a borrower uploads a Purchase Contract, Rent Roll, Financials, Appraisal, or
  Operating Statement, and fills in any still-empty `LoanRequest` fields (never overwrites data the
  borrower already provided).
- **Lender guideline parsing** (`lib/ai/parse-lender-guidelines.ts`): admins/lenders upload a loan
  matrix/guideline doc (PDF/Excel/Word/CSV); OpenAI extracts every distinct program it describes, and
  the free-text loan type/property type/purpose are mapped to our Prisma enums via keyword matching
  (`lib/ai/enum-mapping.ts`), then upserted as `LoanProgram` rows (matched by program name).

Both require `OPENAI_API_KEY`. Without it, the extraction call throws (surfaced as a `FAILED` document
status) — everything else in the app works fine without an OpenAI key.

---

## Getting started (local development)

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL 16 database (either Docker, see below, or a local/managed instance)
- Accounts (free tiers work) for: [Clerk](https://clerk.com), [Supabase](https://supabase.com),
  [OpenAI](https://platform.openai.com) (optional but needed for AI features),
  [Resend](https://resend.com) (optional — emails log to console without it)

### 2. Install

```bash
npm install
cp .env.example .env
```

Fill in `.env` — at minimum `DATABASE_URL`. See [Environment variables](#environment-variables) below
for what each service needs and where to get it.

### 3. Database

Using Docker (recommended):

```bash
docker compose up -d postgres
npx prisma migrate deploy
npm run db:seed
```

Or against any existing Postgres instance — just point `DATABASE_URL` at it, then run the same two
commands.

### 4. Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 5. Log in

The seed script creates three `User` rows (admin/lender/borrower) with **placeholder Clerk IDs** —
Clerk is an external identity provider, so a fresh Clerk application has no idea these users exist yet.
To actually log in as one of them:

1. Sign up for real through the app's `/sign-up` page using the **same email address** as one of the
   seeded rows (`admin@xtravacapital.com`, or the seeded lender/borrower emails — see `prisma/seed.ts`).
2. The Clerk webhook (`/api/webhooks/clerk`) creates a *new* `User` row for that real Clerk account.
   Either:
   - Add your email to `ADMIN_EMAILS` in `.env` *before* signing up, so the webhook auto-promotes you
     to `ADMIN` — the fastest path to seeing the full admin experience with the seeded lenders/borrowers, or
   - Manually update the seeded row's `clerkId` (via `npx prisma studio`) to your real Clerk user ID
     so your login takes over that exact seeded Lender/Borrower profile and its data.

---

## Environment variables

See `.env.example` for the full list with inline comments. Summary of where each comes from:

| Variable | Where to get it |
| --- | --- |
| `DATABASE_URL` | Your Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → add endpoint `https://<your-domain>/api/webhooks/clerk`, subscribe to `user.created` + `user.updated` |
| `ADMIN_EMAILS` | Comma-separated emails to auto-promote to ADMIN on first sign-up |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API. Create a **private** Storage bucket named `documents` (or set `SUPABASE_STORAGE_BUCKET`) |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `RESEND_API_KEY` / `EMAIL_FROM` | resend.com → API keys (optional — emails log to console if unset) |

---

## Testing

```bash
npm run test        # vitest run — matching engine (8 cases) + search parser (7 cases)
npm run test:watch
```

The matching engine tests cover: strong-fit scoring, state/loan-amount/capability disqualification and
score capping, soft-warning degradation without disqualifying, missing-threshold handling (DSCR/LTV/LTC
"not applicable" rather than penalized), ranking order, and multi-program-per-lender collapsing.

---

## Docker

```bash
cp .env.example .env   # fill in real values
docker compose up -d postgres
docker compose run --rm migrate   # applies migrations + seeds demo data
docker compose up -d app
```

`docker-compose.yml` defines three services: `postgres` (16-alpine, healthchecked), `app` (the
production Next.js build, multi-stage `Dockerfile` with `output: "standalone"`), and a `migrate`
one-off (profile `tools`, built from the `builder` stage so it has `tsx` available to run
`prisma/seed.ts` directly).

---

## Deployment (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Set all the environment variables from `.env.example` in the Vercel project settings (production +
   preview).
3. Point `DATABASE_URL` at a managed Postgres (Neon, Supabase Postgres, RDS, etc. all work — Prisma
   just needs a standard connection string).
4. Add a Vercel deployment step (or run once manually) for `npx prisma migrate deploy`. A common
   pattern is wiring it into the Vercel "Build Command": `npx prisma migrate deploy && npm run build`.
5. Update the Clerk webhook endpoint to your production URL, and add your production domain to Clerk's
   allowed origins.
6. Create the Supabase Storage bucket (`documents`, private) in your production Supabase project.

---

## Future-proofing

The architecture already anticipates:

- **Multi-tenant SaaS** — every core model carries `organizationId`; flipping on multiple companies is
  an auth/org-selection change, not a schema migration.
- **CRM integration (HubSpot/Salesforce)** — `ActivityLog` and `Notification` are structured enough to
  drive outbound webhooks/sync jobs without touching the core schema.
- **Automated lender email outreach** — `lib/email/send.ts` + `lib/notify.ts` are already the single
  choke point for all outbound email; adding sequences is additive.
- **API integrations with lenders** — `Match`/`LoanProgram` are lender-agnostic; a lender-facing API
  key + webhook layer can sit alongside the existing `/api/lenders/me` self-service routes.
- **AI underwriting recommendations / capital stack optimization** — the AI layer already produces
  structured JSON (not free text), so a recommendation engine can consume `extractedData` directly.
- **White-label portals / mobile app** — the API routes are already the real backend (pages are thin
  Server Components over them for anything mutation-heavy going through `fetch`), so a mobile client or
  white-label frontend can reuse the same `/api/*` surface.

---

## Known limitations / honest caveats

- **shadcn CLI wasn't reachable** in this environment (network policy blocked `ui.shadcn.com`), so the
  UI primitives were hand-written to match its conventions instead of `npx shadcn add`. Functionally
  equivalent; cosmetically identical to the default "new-york" style.
- **Clerk requires real keys to fully exercise auth.** With placeholder keys (as ship in `.env` for
  `next build`/`next dev` to not crash), Clerk's dev-browser handshake can't complete against a
  non-existent tenant domain, so protected routes 404 instead of redirecting to sign-in. This is a
  Clerk-side network requirement, not an app bug — get real keys from clerk.com to test the full auth
  flow.
- **Document uploads are proxied through the Next.js server** (not signed direct-to-Supabase uploads),
  which is simpler and fine for typical loan documents but is capped by your hosting platform's request
  body size limit (e.g. Vercel's default). For very large files, switch `/api/documents` to issue a
  Supabase signed upload URL and have the client upload directly.
- **Seeded users have placeholder Clerk IDs** (see [Log in](#5-log-in) above) since Clerk is an
  external identity provider this environment can't create real accounts against.
