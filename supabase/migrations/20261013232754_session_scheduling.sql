-- Session scheduling: a weekly timetable per class, from which a term's
-- sessions are generated, plus a start time on every session.

alter table public.sessions add column start_time time;

-- One session per class per date and time, so generating the same week twice
-- (or a makeup landing on an existing slot) can't create duplicates. Rows
-- without a start time (created before this column existed) never conflict.
create unique index sessions_class_date_time_key
  on public.sessions (class_id, date, start_time);

create table public.class_schedule (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO weekday: 1 = Monday
  start_time time not null,
  created_at timestamptz not null default now(),
  unique (class_id, weekday, start_time)
);

alter table public.class_schedule enable row level security;

create policy "admin full access class_schedule" on public.class_schedule
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads own class_schedule" on public.class_schedule
  for select using (
    public.current_role() = 'coach'
    and class_id in (select id from public.classes where coach_id = public.current_coach_id())
  );

create policy "school reads own class_schedule" on public.class_schedule
  for select using (
    public.current_role() = 'school'
    and class_id in (select id from public.classes where school_id = public.current_school_id())
  );
