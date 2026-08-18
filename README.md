# KLUTCH SportsEd — Internal ERP (Demo Dashboard)

A working demo of the KLUTCH SportsEd internal ERP from the Developer Brief.
All modules and **3 user roles** are integrated into one app, driven by
realistic **mock data** (no backend required).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint / next lint
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
  `src/lib/seed.ts` and `src/lib/fitnessSeed.ts` with schools, coaches, sessions,
  assessments, cancellations, equipment, and CISCE fitness records (plus a
  `sport` per class: Football / Basketball / Tennis). In-memory and interactive;
  resets on refresh.
- **Client-side PDF export** — `jspdf` + `html2canvas-pro` (both lazy-loaded, so
  they stay out of the initial bundle).

## Analytics & report cards

- **Sports Analytics** — completion by sport, team skill averages,
  sessions-by-status, and a coach leaderboard. Sport identity is always encoded
  by **icon + label + value** (not color alone) — the categorical palette was
  validated for colorblind separation.
- **CISCE Fitness Analytics** — fitness metrics (50m dash, 600m run/walk,
  forward toe touch, push-ups, curls, BMI, attendance) analyzed against
  same-school-and-grade cohorts.
- **Player Report Card** — per-student report (Student Assessment → "Report
  Card"): overall grade, comparison vs class average, per-skill bars with
  class-average markers, and auto-derived strengths / focus areas.
- **CISCE Fitness Report Card** — per-student fitness report (Fitness Analytics
  → "Report Card"): cohort profile, per-metric breakdown vs the school-grade
  average, and coaching focus areas.

### Download to PDF

Both report cards have a **Download PDF** button that produces a real file and
saves it to your machine's Downloads folder — no backend, one click.

- Implemented in `src/lib/pdf.ts` (`downloadElementPdf`), shared by both cards.
- Captures the live report card DOM at 2× resolution and writes a **single,
  content-sized page** (no clipping, no wasted whitespace).
- Renders the export with **light-theme tokens** for a crisp, print-friendly
  document even when the dashboard is in dark mode; the branded dark header is
  preserved.
- Interactive controls (the download / save buttons) are marked `data-pdf-hide`
  and stripped from the exported document.

## What's integrated

Use the **role switcher** (top-right: Admin / Coach / School) to move between
the three experiences.

| Role | What you see |
|------|--------------|
| **Admin** | Full sidebar → all modules + dashboard |
| **Coach** | Phone-first mobile screen: attendance toggle, session tick, cancellation (≤ 3 actions) |
| **School** | 4-tab portal (Sessions / Curriculum / Students / Report), scoped to one school |

### Modules (Admin sidebar)

**Overview**
1. **Dashboard** — stat cards, quick actions, live Recent Activity table
2. **Sports Analytics** — completion by sport, skill averages, coach leaderboard
3. **Fitness Analytics** — CISCE fitness metrics + fitness report cards

**Coaches**
4. **Coach Management** — profiles, school assignment, star performance ratings, add coach
5. **Coach Attendance** — one-tap present/absent per coach

**Sessions**
6. **Session Tracker** — filterable table (school + status), update session status
7. **Cancellation Log** — log cancellations (School / KLUTCH) with reason + reschedule
8. **Curriculum Tracker** — per-class week progress bars

**Students & Equipment**
9. **Student Assessment** — 1–5 skill ratings + auto report-card modal (PDF export)
10. **Equipment Log** — inventory per school, condition cycling, replace flags

**Portals**
11. **School Portal** — school-facing 4-tab view + downloadable monthly report (demo)
12. **Coach Mobile View** — the phone-first coach experience

## Everything is live-linked

Actions update the shared store, so e.g. marking a session **Done** in the
Coach view or Session Tracker updates the Admin dashboard stat cards and
curriculum progress immediately — mirroring the real-time behavior the brief
specifies for Supabase.

## Project structure

```
src/
  app/          layout, page, global styles
  components/   Logo, icons, shell, theme, shared UI, FitnessReportCards
  lib/          store (context), seed data, stats, types, nav, pdf export
  modules/      one file per module (Dashboard, SportsAnalytics, etc.)
```

## Mapping to production

This demo intentionally uses mock data. To go live per the brief, swap
`src/lib/store.tsx` reads/writes for Supabase (PostgreSQL + Auth), keep the
same table shape defined in `src/lib/types.ts`, and — if you want
server-generated documents — move PDF rendering server-side (React-PDF /
Puppeteer). The current client-side export in `src/lib/pdf.ts` already works for
on-demand downloads with no backend. The UI layer stays as-is.
