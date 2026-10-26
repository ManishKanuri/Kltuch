-- The JGS PET programme. Sessions come from the school's weekly timetable and
-- carry their planned sport and lesson (src/lib/programme.ts); coaches report
-- what actually happened. The demo tables (sessions, classes, cancellations …)
-- and their sample rows are left as they are; the app no longer reads them.

-- ---------- 1. Timetable and sessions ----------
create type public.delivery_status as enum ('Not reported', 'Done', 'Not Done', 'Cancelled', 'Postponed');

create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  period smallint not null check (period between 1 and 12),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  group_label text not null check (length(btrim(group_label)) between 1 and 40),
  grade smallint check (grade between 1 and 12), -- null for a mixed group
  coach_id uuid references public.coaches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, weekday, period, group_label)
);

create table public.pet_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 60),
  school_id uuid not null references public.schools(id) on delete cascade,
  slot_id uuid references public.timetable_slots(id) on delete set null,
  date date not null,
  period smallint not null check (period between 1 and 12),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  group_label text not null,
  grade smallint check (grade between 1 and 12),
  teaching_week smallint not null check (teaching_week >= 1),
  block smallint not null check (block >= 1),
  week_in_block smallint not null check (week_in_block between 1 and 6),
  sport public.sport, -- null only for a mixed group whose classes play different sports
  curriculum_code text,
  lesson text,
  coach_id uuid references public.coaches(id) on delete set null,
  status public.delivery_status not null default 'Not reported',
  reason text check (length(reason) <= 80),
  actual_date date,
  remarks text check (length(remarks) <= 1000), -- internal to KLUTCH
  reported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pet_sessions_school_date_idx on public.pet_sessions(school_id, date);
create index pet_sessions_coach_date_idx on public.pet_sessions(coach_id, date);
create index pet_sessions_slot_id_idx on public.pet_sessions(slot_id);

create trigger timetable_slots_set_updated_at before update on public.timetable_slots
  for each row execute function public.set_updated_at();
create trigger pet_sessions_set_updated_at before update on public.pet_sessions
  for each row execute function public.set_updated_at();

-- When a status is first reported (or changed), stamp the time, so the admin
-- can see sessions reported late. Clearing back to "Not reported" clears it.
create function public.stamp_session_report()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.reported_at := case when new.status = 'Not reported' then null else now() end;
  end if;
  return new;
end;
$$;

create trigger pet_sessions_stamp_report before update on public.pet_sessions
  for each row execute function public.stamp_session_report();

-- A signed-in coach reports on a session; the plan itself (date, group,
-- sport, lesson, coach) is the admin's to change.
create function public.limit_coach_session_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.current_role() = 'coach' and (
    new.code, new.school_id, new.slot_id, new.date, new.period, new.start_time, new.end_time,
    new.group_label, new.grade, new.teaching_week, new.block, new.week_in_block, new.sport,
    new.curriculum_code, new.lesson, new.coach_id
  ) is distinct from (
    old.code, old.school_id, old.slot_id, old.date, old.period, old.start_time, old.end_time,
    old.group_label, old.grade, old.teaching_week, old.block, old.week_in_block, old.sport,
    old.curriculum_code, old.lesson, old.coach_id
  ) then
    raise exception 'Coaches can only report a session''s status, reason, delivery date and remarks'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger pet_sessions_limit_coach_edits before update on public.pet_sessions
  for each row execute function public.limit_coach_session_edits();

-- ---------- 2. Access for signed-in users ----------
-- (Used once sign-in is switched back on; see the open_access_pilot migration.)
alter table public.timetable_slots enable row level security;
alter table public.pet_sessions enable row level security;

create policy "admin full access timetable_slots" on public.timetable_slots
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads own school timetable" on public.timetable_slots
  for select using (
    public.current_role() = 'coach'
    and school_id = (select assigned_school_id from public.coaches where id = public.current_coach_id())
  );

create policy "school reads own timetable" on public.timetable_slots
  for select using (public.current_role() = 'school' and school_id = public.current_school_id());

create policy "admin full access pet_sessions" on public.pet_sessions
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads own school sessions" on public.pet_sessions
  for select using (
    public.current_role() = 'coach'
    and school_id = (select assigned_school_id from public.coaches where id = public.current_coach_id())
  );

create policy "coach reports own sessions" on public.pet_sessions
  for update using (public.current_role() = 'coach' and coach_id = public.current_coach_id())
  with check (public.current_role() = 'coach' and coach_id = public.current_coach_id());

-- Schools read their sessions. Before school logins are turned on, serve them
-- a view without the remarks column: remarks are KLUTCH-internal.
create policy "school reads own sessions" on public.pet_sessions
  for select using (public.current_role() = 'school' and school_id = public.current_school_id());

-- ---------- 3. Live updates ----------
alter publication supabase_realtime add table public.pet_sessions, public.timetable_slots;
