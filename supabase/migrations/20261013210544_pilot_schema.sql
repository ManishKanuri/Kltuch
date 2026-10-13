-- KLUTCH SportsEd — pilot schema (Assessment & Performance Tracking + AI & Dashboard)
-- Tables: schools, coaches, classes, profiles, assessments, fitness_assessments
-- Source of truth: src/lib/types.ts

-- ---------- Enums ----------

create type public.role as enum ('admin', 'coach', 'school');
create type public.coach_status as enum ('Active', 'Inactive');
create type public.sport as enum ('Football', 'Basketball', 'Tennis');
create type public.fitness_section as enum ('A', 'B', 'C');
create type public.gender as enum ('Female', 'Male');

-- ---------- Core tables ----------

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  contact_person text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  assigned_school_id uuid not null references public.schools(id) on delete restrict,
  status public.coach_status not null default 'Active',
  rating numeric(2,1) not null default 3.0 check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  class_name text not null,
  section text not null,
  coach_id uuid not null references public.coaches(id) on delete restrict,
  sport public.sport not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extends auth.users with role + tenant scoping. See blueprint §5.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.role not null,
  coach_id uuid references public.coaches(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  full_name text,
  created_at timestamptz not null default now(),
  constraint profiles_role_scope_check check (
    (role = 'admin') or
    (role = 'coach' and coach_id is not null) or
    (role = 'school' and school_id is not null)
  )
);

-- ---------- Assessment & Performance Tracking ----------

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  class_id uuid not null references public.classes(id) on delete restrict,
  term text not null,
  ratings jsonb not null, -- Record<SkillKey, number>, each 1-5; validated at app layer
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fitness_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  student_name text not null,
  school_id uuid not null references public.schools(id) on delete restrict,
  age smallint not null check (age > 0),
  grade smallint not null check (grade >= 0),
  section public.fitness_section not null,
  class_name text not null,
  gender public.gender not null,
  date date not null,
  speed_50m_seconds numeric(5,2) not null,
  stamina_600m_seconds numeric(6,2) not null,
  toe_touch_cm numeric(5,2) not null,
  push_ups smallint not null check (push_ups >= 0),
  curls smallint not null check (curls >= 0),
  height_cm numeric(5,2) not null,
  weight_kg numeric(5,2) not null,
  bmi numeric(4,1) not null, -- stored measurement only; no clinical categorization
  attendance_rate numeric(5,2) not null check (attendance_rate >= 0 and attendance_rate <= 100),
  sessions_scheduled smallint not null default 0,
  sessions_finished smallint not null default 0,
  sessions_missed smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Indexes ----------

create index coaches_assigned_school_id_idx on public.coaches(assigned_school_id);
create index classes_school_id_idx on public.classes(school_id);
create index classes_coach_id_idx on public.classes(coach_id);
create index profiles_coach_id_idx on public.profiles(coach_id);
create index profiles_school_id_idx on public.profiles(school_id);
create index assessments_class_id_idx on public.assessments(class_id);
create index assessments_term_idx on public.assessments(term);
create index fitness_assessments_school_grade_idx on public.fitness_assessments(school_id, grade);

-- ---------- updated_at trigger ----------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_set_updated_at before update on public.schools
  for each row execute function public.set_updated_at();
create trigger coaches_set_updated_at before update on public.coaches
  for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes
  for each row execute function public.set_updated_at();
create trigger assessments_set_updated_at before update on public.assessments
  for each row execute function public.set_updated_at();
create trigger fitness_assessments_set_updated_at before update on public.fitness_assessments
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
-- Default-deny: enable RLS on every table now. Policies follow in the next
-- migration (Phase 4), once auth/profiles flows are wired up. Until then, only
-- the service_role key (server-side only) can read/write these tables.

alter table public.schools enable row level security;
alter table public.coaches enable row level security;
alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.fitness_assessments enable row level security;
