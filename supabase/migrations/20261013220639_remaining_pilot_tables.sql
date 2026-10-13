-- KLUTCH SportsEd — remaining tables from the blueprint's §4.1 (sessions,
-- cancellations, equipment, coach_attendance, curriculum), closing the gap
-- that left those modules on stale mock data referencing IDs that don't
-- exist in the real schools/coaches/classes tables.

-- ---------- Enums ----------

create type public.session_status as enum ('Done', 'Pending', 'Cancelled');
create type public.cancelled_by as enum ('School', 'KLUTCH');
create type public.equipment_condition as enum ('Good', 'Fair', 'Damaged');
create type public.equipment_status as enum ('Active', 'Replace');

-- ---------- Tables ----------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  coach_id uuid not null references public.coaches(id) on delete restrict,
  date date not null,
  status public.session_status not null default 'Pending',
  curriculum_week smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cancellations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  cancelled_by public.cancelled_by not null,
  reason text not null,
  rescheduled_date date,
  created_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  qty smallint not null default 1,
  school_id uuid not null references public.schools(id) on delete restrict,
  condition public.equipment_condition not null default 'Good',
  date_issued date not null default current_date,
  status public.equipment_status not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_attendance (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete cascade,
  date date not null,
  present boolean not null default true,
  created_at timestamptz not null default now(),
  unique (coach_id, date)
);

create table public.curriculum (
  class_id uuid primary key references public.classes(id) on delete cascade,
  current_week smallint not null default 1,
  total_weeks smallint not null default 12,
  last_delivered date,
  updated_at timestamptz not null default now()
);

-- ---------- Denormalized view for the Cancellation Log table ----------
-- Mirrors the app's CancellationRow type: joins back through sessions ->
-- classes -> schools so the UI never has to do that join itself.

create view public.cancellation_rows as
select
  c.id,
  s.date,
  cl.school_id,
  cl.class_name,
  c.cancelled_by,
  c.reason,
  c.rescheduled_date
from public.cancellations c
join public.sessions s on s.id = c.session_id
join public.classes cl on cl.id = s.class_id;

-- ---------- Indexes ----------

create index sessions_class_id_idx on public.sessions(class_id);
create index sessions_coach_id_idx on public.sessions(coach_id);
create index sessions_date_idx on public.sessions(date);
create index sessions_status_idx on public.sessions(status);
create index cancellations_session_id_idx on public.cancellations(session_id);
create index equipment_school_id_idx on public.equipment(school_id);
create index coach_attendance_coach_id_idx on public.coach_attendance(coach_id);
create index coach_attendance_date_idx on public.coach_attendance(date);

-- ---------- updated_at triggers (reuses set_updated_at() from Phase 1) ----------

create trigger sessions_set_updated_at before update on public.sessions
  for each row execute function public.set_updated_at();
create trigger equipment_set_updated_at before update on public.equipment
  for each row execute function public.set_updated_at();
create trigger curriculum_set_updated_at before update on public.curriculum
  for each row execute function public.set_updated_at();

-- ---------- RLS: default-deny, same pattern as Phase 1 ----------
-- Policies (admin/coach/school access matrix) land in a follow-up migration,
-- same as schools/coaches/classes/assessments/fitness_assessments did.

alter table public.sessions enable row level security;
alter table public.cancellations enable row level security;
alter table public.equipment enable row level security;
alter table public.coach_attendance enable row level security;
alter table public.curriculum enable row level security;
