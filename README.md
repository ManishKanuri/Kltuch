# KLUTCH SportsEd — PET Programme Dashboard

Session tracking, coach attendance and programme analytics for the PET
programme at Johnson Grammar School, Mallapur (Classes 8–12, 24 weeks from
2 November 2026). Next.js 15 (App Router) on Vercel, Supabase (Postgres, live
updates) in Mumbai.

Live: https://kltuch.vercel.app

## Who sees what

- **Admin** (KLUTCH): programme dashboard with charts, session tracking for every
  session, the timetable with coach assignment, coaches, and coach attendance.
- **Coach**: a phone-first view of today's sessions (one tap for Done), a reason
  and remarks when a session didn't happen, sessions still waiting for a report,
  and their own attendance.
- **School**: delivery analytics by week, class and sport, curriculum progress,
  why sessions were missed (school side or KLUTCH side), and this week's
  schedule. Internal remarks and coach attendance are never shown here.

**Sign-in is off for the pilot** (`src/lib/access.ts`): each device picks a view
on the start screen, and anyone with the link can use any view. To turn sign-in
back on, set `OPEN_ACCESS` to `false` and add a migration that drops the
"open pilot" policies (see `supabase/migrations/*_open_access_pilot.sql`). Invites
then work from the Team access screen.

## The programme data

Everything planned comes from `src/lib/programme.ts`:

- the master PET timetable (45 weekly slots; a slash pair such as 10J/10L is one
  session), with periods and times from the school's timetable PDF;
- the sports rotation (four blocks of six weeks, Football, Basketball,
  Volleyball) and the six-week curriculum codes and lessons;
- reference holidays, which are reminders only.

Each session keeps the plan it was created with (sport, curriculum code, lesson,
teaching week) and a stable code such as `JGS-20261102-P8-8D`. Sessions are
loaded for 2 November to 30 December; later weeks are added from the Timetable
screen once the school confirms its calendar.

Statuses are Done, Not Done, Cancelled and Postponed; "Not reported" means no
one has reported it yet. A session counts as **due** once its date has passed,
or on the day once it's reported, and the **delivery rate** is Done out of due
(`src/lib/analytics.ts`), so unreported sessions never count as delivered.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Needs `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (server and scripts
only) and `SUPABASE_ACCESS_TOKEN` (Supabase CLI only). The file is git-ignored.

Load or top up the programme (safe to rerun; it never overwrites reports or
coach assignments):

```bash
set -a && source .env.local && set +a && npx tsx scripts/seed-jgs.ts
```

Database changes live in `supabase/migrations` (`npx supabase db push`). The
older demo tables (sessions, classes, assessments, fitness) are still in the
database with their sample rows; the app no longer reads them.

## Project structure

```
src/
  app/          root layout, login (unused while sign-in is off), invite API
  components/   shell, charts, session report dialog, shared UI, icons
  lib/          programme plan, analytics, store (data + saves), types, dates
  modules/      Dashboard, Sessions, Timetable, Coaches, Attendance,
                CoachView, SchoolView, TeamAccess
scripts/        seed-jgs.ts, invite-user.ts
supabase/       migrations
```
