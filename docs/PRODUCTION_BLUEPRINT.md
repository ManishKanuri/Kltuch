# KLUTCH SportsEd — Production Blueprint

Architecture and migration plan for taking the demo (mock-data, in-memory) to a
real, multi-tenant product with a database, authentication, and enforced
permissions.

> Status: **design document**. No code changes are implied by this file. Each
> phase below has its own deliverables and acceptance criteria.

---

## 1. Goals & non-goals

**Goals**
- Persist all data in a real database (survives refresh, shared across users).
- Real authentication — users log in; identity is trusted.
- Enforced authorization — a user can only read/write data they're entitled to,
  guaranteed at the database layer (not the UI).
- Keep the existing UI and UX intact; migrate the *plumbing*, not the screens.
- Multi-tenant by school; real-time updates across users.

**Non-goals (for v1)**
- Native mobile apps (the Coach Mobile View stays a responsive web screen).
- Offline-first / sync engine.
- Server-side PDF rendering (current client-side export is sufficient).
- Billing / payments.

---

## 2. Current vs target architecture

| Concern | Now (demo) | Target (production) |
|---|---|---|
| Data store | In-memory arrays in React Context (`src/lib/store.tsx`), seeded from `seed.ts` / `fitnessSeed.ts`; resets on refresh | Supabase Postgres, persisted |
| Identity | Role switcher in the top bar (cosmetic) | Supabase Auth (email/password or OAuth) |
| Authorization | None — every role sees all data | Row Level Security (RLS) policies in Postgres |
| Tenancy scoping | None | Per-school; coaches scoped to assigned schools |
| Reactivity ("live-linked") | Works because it's one JS object | Supabase Realtime subscriptions |
| PDF export | Client-side (`src/lib/pdf.ts`) | Unchanged |
| Hosting | Local dev | Vercel (preview + production) |

**Design principle:** the entire app already funnels every mutation through the
`StoreShape` interface in `src/lib/store.tsx`. That single seam is where the
backend gets swapped in. Components call `setSessionStatus(...)`,
`addAssessment(...)`, etc. — they never touch data directly — so re-pointing
those methods at Supabase leaves the UI untouched.

---

## 3. Tech stack

- **Next.js 15 (App Router) + React 19** — unchanged.
- **Supabase** — Postgres + Auth + Row Level Security + Realtime in one service.
  Chosen over a bare Postgres (e.g. Neon) because it bundles auth and RLS, which
  are core requirements here, and matches the original brief.
- **Vercel** — hosting, preview deployments, environment management.
- **`@supabase/supabase-js`** + **`@supabase/ssr`** — client and server-side
  session handling for the App Router.
- **Tailwind, jspdf, html2canvas-pro** — unchanged.

---

## 4. Data model

Source of truth for the schema is `src/lib/types.ts`. Each interface becomes a
table. IDs move from string prefixes (`sch_abc`) to `uuid` primary keys;
string-literal unions become Postgres `enum` types.

### 4.1 Tables

| Table | From type | Key relationships |
|---|---|---|
| `schools` | `School` | — |
| `coaches` | `Coach` | `assigned_school_id → schools.id` |
| `classes` | `ClassRoom` | `school_id → schools.id`, `coach_id → coaches.id` |
| `sessions` | `Session` | `class_id → classes.id`, `coach_id → coaches.id` |
| `cancellations` | `Cancellation` | `session_id → sessions.id` |
| `assessments` | `Assessment` | `class_id → classes.id` |
| `fitness_assessments` | `FitnessAssessment` | `school_id → schools.id` |
| `equipment` | `Equipment` | `school_id → schools.id` |
| `coach_attendance` | `CoachAttendance` | `coach_id → coaches.id` |
| `curriculum` | `CurriculumWeek` | `class_id → classes.id` (1:1) |
| `profiles` | *new* | `id → auth.users.id`; see §5 |

Notes:
- `CancellationRow` is a **denormalized view** for the Cancellation Log table —
  implement as a SQL `view` joining `cancellations → sessions → classes →
  schools`, not a base table.
- `Assessment.ratings` (`Record<SkillKey, number>`) — store as a `jsonb` column,
  or normalize into an `assessment_skills` child table. **Recommendation: jsonb**
  for v1 (fewer joins, matches the type exactly); normalize later only if you
  need per-skill querying/aggregation in SQL.
- BMI stays a stored measurement only (per the type's comment) — no clinical
  categorization in the schema.

### 4.2 Enums

| Enum type | Values | Used by |
|---|---|---|
| `role` | `admin`, `coach`, `school` | `profiles` |
| `coach_status` | `Active`, `Inactive` | `coaches` |
| `sport` | `Football`, `Basketball`, `Tennis` | `classes` |
| `session_status` | `Done`, `Pending`, `Cancelled` | `sessions` |
| `cancelled_by` | `School`, `KLUTCH` | `cancellations` |
| `equipment_condition` | `Good`, `Fair`, `Damaged` | `equipment` |
| `equipment_status` | `Active`, `Replace` | `equipment` |

### 4.3 Conventions

- Primary keys: `uuid default gen_random_uuid()`.
- Timestamps: add `created_at timestamptz default now()` and `updated_at` to
  every table (not in the demo types, but required in production).
- Indexes: foreign-key columns + common filter columns (`sessions.status`,
  `sessions.date`, `fitness_assessments.school_id + grade`).
- Naming: snake_case in SQL; a thin mapping layer converts to the camelCase the
  TypeScript types use (or generate types with `supabase gen types`).

---

## 5. Authentication & authorization

This is the **make-or-break** part. The demo's role switcher is cosmetic; in
production the permission boundary must live in the database.

### 5.1 Identity

- Supabase Auth issues a session per user.
- A `profiles` row extends each `auth.users` record:

  | Column | Purpose |
  |---|---|
  | `id` (FK → auth.users) | user identity |
  | `role` (enum) | `admin` / `coach` / `school` |
  | `coach_id` (nullable FK → coaches) | set when role = coach |
  | `school_id` (nullable FK → schools) | set when role = school |
  | `full_name`, `created_at` | metadata |

- The invite API (`/api/invite-user`) creates the `profiles` row with the role
  and scope the inviting admin chose. Roles never come from signup metadata,
  which the person signing up controls, and public sign-up is disabled in
  Supabase Auth, so accounts exist only by invitation.
  (`scripts/invite-user.ts` does the same from the CLI, to bootstrap the first
  admin of a new environment.)

### 5.2 Access matrix

| Data | Admin | Coach | School |
|---|---|---|---|
| Schools | all (CRUD) | read assigned | read own |
| Coaches | all (CRUD) | read self | read coaches at own school |
| Classes | all | read where `coach_id = self` | read where `school_id = own` |
| Sessions | all | read/update own sessions | read own school's |
| Cancellations | all | create for own sessions | create/read for own school |
| Assessments | all | create/update for own classes | read own school's |
| Fitness assessments | all | create/update own school's | read own school's |
| Equipment | all | read own school's | read own school's |
| Coach attendance | all | update self | read own school's coaches |
| Curriculum | all | update own classes | read own school's |

### 5.3 Enforcement — Row Level Security

Every table gets `enable row level security` plus policies keyed off the
caller's `profiles` row. Pattern (illustrative, not final):

```sql
-- coaches can only see classes they are assigned to
create policy "coach reads own classes"
on classes for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and (p.role = 'admin'
        or (p.role = 'coach'  and classes.coach_id  = p.coach_id)
        or (p.role = 'school' and classes.school_id = p.school_id))
  )
);
```

Every table needs SELECT/INSERT/UPDATE/DELETE policies derived from the matrix
above. **RLS is the real boundary — the UI role switcher becomes a convenience
that only reflects the authenticated user's actual role.**

---

## 6. Data access layer

**Strategy: swap the internals of `store.tsx`, keep its public API.**

1. Introduce a Supabase client (`src/lib/supabase/`): a browser client and a
   server client via `@supabase/ssr`.
2. Replace each `StoreShape` method body:
   - reads (`schoolName`, table lists) → Supabase `select`
   - writes (`setSessionStatus`, `addAssessment`, `logCancellation`, …) →
     Supabase `insert`/`update`, then let Realtime (or optimistic update)
     refresh local state.
3. Hydrate initial state from the database instead of `seed.ts`.

**Evolution path (optional, post-v1):** move reads into Server Components and
writes into Server Actions for better caching and smaller client bundles. The
low-churn first cut keeps the client Context and just re-points it, so the UI
ships unchanged.

Seed data (`seed.ts`, `fitnessSeed.ts`) becomes a **one-time SQL seed script**
loaded into the database, not runtime state.

---

## 7. Real-time

Replace "it's all one JS object" reactivity with Supabase Realtime:
- Subscribe to `sessions`, `assessments`, `equipment`, `coach_attendance`.
- On change events, update local store state so e.g. marking a session **Done**
  in the Coach view updates the Admin dashboard for other logged-in users.
- Scope subscriptions by the user's tenant to avoid leaking cross-school events
  (RLS also applies to Realtime).

---

## 8. Environments & deployment

- **Supabase projects:** one for production, optionally one for staging.
- **Vercel:** connect the GitHub repo; `main` → production, PRs → preview.
- **Env vars** (Vercel + `.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only — never exposed to the client)
- **Migrations:** managed with the Supabase CLI (`supabase/migrations/`), run in
  CI on deploy so schema changes are versioned and reproducible.

---

## 9. Migration phases

| Phase | Deliverable | Acceptance criteria |
|---|---|---|
| **1. Schema** | SQL migrations for all tables, enums, FKs, indexes + the `CancellationRow` view | Migration runs clean on an empty Supabase project |
| **2. Provision + seed** | Supabase project created; `seed.ts`/`fitnessSeed.ts` loaded; env vars set | App reads real seed data from the DB |
| **3. Data layer swap** | `store.tsx` methods re-pointed at Supabase | All modules work against the DB; refresh persists data |
| **4. Auth + RLS** | Supabase Auth login; `profiles` + trigger; full RLS policy set | A coach cannot read another school's rows even via direct API calls |
| **5. Realtime + deploy** | Realtime subscriptions; Vercel prod + preview | Cross-user live updates; app live on a URL |
| **6. Hardening** | RLS audit, write validation, backups, monitoring | Security review passes; automated backups on |

---

## 10. Security hardening checklist

- [ ] RLS enabled on **every** table (default-deny; no table left open).
- [ ] Service-role key used only in server code; never shipped to the browser.
- [ ] Server-side validation on all writes (don't trust client payloads).
- [ ] Auth redirects/guards on protected routes.
- [ ] Rate limiting on write-heavy endpoints.
- [ ] Automated database backups + tested restore.
- [ ] Error/perf monitoring (e.g. Vercel Analytics + Sentry).
- [ ] Audit trail on sensitive mutations (session status, cancellations).

---

## 11. Risks & open questions

- **Role provisioning flow** — how are coaches/schools invited and assigned
  their `coach_id` / `school_id`? Needs an admin invite UI (not in the demo).
- **Assessment ratings storage** — jsonb (recommended v1) vs normalized; decide
  based on whether SQL-side per-skill analytics are needed.
- **Historical data / student identity** — the demo uses free-text student
  names; production may need a real students table with stable IDs and
  privacy considerations (minors' data).
- **BMI / fitness data sensitivity** — health-adjacent data on minors; confirm
  data-retention and consent requirements before storing at scale.
- **Multi-term / historical assessments** — confirm whether assessments are
  append-only per term (history) or editable in place.

---

## 12. Immediate next step

Phase 1 (schema) requires no accounts or secrets and can be generated directly
from `src/lib/types.ts`. That is the recommended starting point.
