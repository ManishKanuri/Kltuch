# KLUTCH SportsEd — Internal ERP (Demo Dashboard)

A working demo of the KLUTCH SportsEd internal ERP from the Developer Brief.
All **8 modules** and **3 user roles** are integrated into one app, driven by
realistic **mock data** (no backend required).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Stack & identity

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS** with a **KLUTCH brand design system** — the logo's
  blue→orange gradient, tennis-yellow accents, `Sora` display + `Inter` body
  fonts, and a signature dark sidebar.
- **Light / dark ("day / night") mode** — toggle in the top bar, persisted to
  `localStorage`, no flash on load.
- **Custom SVG logo mark** (`src/components/Logo.tsx`) — a vector interpretation
  of the K (blue court + orange basketball arms + tennis ball).
- **Custom line-icon set** (`src/components/icons.tsx`) — no emoji anywhere.
- **Mock data store** — React Context (`src/lib/store.tsx`), seeded from
  `src/lib/seed.ts` with the exact schools, coaches, sessions, assessments,
  cancellations, and equipment in the brief (plus a `sport` per class:
  Football / Basketball / Tennis). In-memory and interactive; resets on refresh.

## Sports analytics & report cards

- **Sports Analytics module** — completion by sport, team skill averages,
  sessions-by-status, and a coach leaderboard. Sport identity is always encoded
  by **icon + label + value** (not color alone) — the categorical palette was
  validated for colorblind separation.
- **Player Report Card** — per-student analytical report (Student Assessment →
  "Report Card"): overall grade, comparison vs class average, per-skill bars
  with class-average markers, and auto-derived strengths / focus areas.

## What's integrated

Use the **role switcher** (top-right: Admin / Coach / School) to move between
the three experiences.

| Role | What you see |
|------|--------------|
| **Admin** | Full sidebar → all 8 modules + dashboard |
| **Coach** | Phone-first mobile screen: attendance toggle, session tick, cancellation (≤ 3 actions) |
| **School** | 4-tab portal (Sessions / Curriculum / Students / Report), scoped to one school |

### Modules (Admin sidebar)

1. **Dashboard** — 4 stat cards, quick actions, live Recent Activity table
2. **Coach Management** — profiles, school assignment, star performance ratings, add coach
3. **Coach Attendance** — one-tap present/absent per coach
4. **Session Tracker** — filterable table (school + status), update session status
5. **Cancellation Log** — log cancellations (School / KLUTCH) with reason + reschedule
6. **Curriculum Tracker** — per-class week progress bars
7. **Student Assessment** — 1–5 skill ratings + auto report-card modal
8. **Equipment Log** — inventory per school, condition cycling, replace flags
9. **School Portal** — the school-facing 4-tab view + downloadable monthly report (demo)

## Everything is live-linked

Actions update the shared store, so e.g. marking a session **Done** in the
Coach view or Session Tracker updates the Admin dashboard stat cards and
curriculum progress immediately — mirroring the real-time behavior the brief
specifies for Supabase.

## Mapping to production

This demo intentionally uses mock data. To go live per the brief, swap
`src/lib/store.tsx` reads/writes for Supabase (PostgreSQL + Auth), keep the
same 8-table shape defined in `src/lib/types.ts`, and render report cards
server-side with React-PDF / Puppeteer. The UI layer stays as-is.
