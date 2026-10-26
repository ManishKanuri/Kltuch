-- Student roster: one row per student, keyed by the school's own admission
-- number, so importing an updated spreadsheet updates students instead of
-- adding them twice. Students who leave are marked inactive, not deleted, so
-- their assessments keep pointing at them.

-- Lets students reference (class, school) together, below.
alter table public.classes add constraint classes_id_school_id_key unique (id, school_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  admission_no text not null check (length(btrim(admission_no)) between 1 and 40),
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  -- The KLUTCH class (a school class-section) the student is in, if any.
  class_id uuid,
  gender public.gender,
  date_of_birth date check (date_of_birth > '1990-01-01'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, admission_no),
  -- A student can only be in a class at their own school. Coaches read
  -- students through their classes, so a wrong class would show one school's
  -- students to another school's coach.
  foreign key (class_id, school_id) references public.classes (id, school_id)
    on delete set null (class_id)
);

create index students_class_id_idx on public.students(class_id);

create trigger students_set_updated_at before update on public.students
  for each row execute function public.set_updated_at();

alter table public.students enable row level security;

create policy "admin full access students" on public.students
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads own class students" on public.students
  for select using (
    public.current_role() = 'coach'
    and class_id in (select id from public.classes where coach_id = public.current_coach_id())
  );

create policy "school reads own students" on public.students
  for select using (
    public.current_role() = 'school' and school_id = public.current_school_id()
  );

-- Skill assessments point at the roster from now on. Older rows keep only the
-- name they were saved with.
alter table public.assessments
  add column student_id uuid references public.students(id) on delete restrict;

create index assessments_student_id_idx on public.assessments(student_id);
