-- RLS policies for sessions, cancellations, equipment, coach_attendance,
-- curriculum — same admin/coach/school pattern as the Phase 4 migration.

-- ---------- sessions ----------

create policy "admin full access sessions" on public.sessions
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach manages own sessions" on public.sessions
  for all using (
    public.current_role() = 'coach' and coach_id = public.current_coach_id()
  )
  with check (
    public.current_role() = 'coach' and coach_id = public.current_coach_id()
  );

create policy "school reads own sessions" on public.sessions
  for select using (
    public.current_role() = 'school'
    and class_id in (select id from public.classes where school_id = public.current_school_id())
  );

-- ---------- cancellations ----------

create policy "admin full access cancellations" on public.cancellations
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach manages own session cancellations" on public.cancellations
  for all using (
    public.current_role() = 'coach'
    and session_id in (select id from public.sessions where coach_id = public.current_coach_id())
  )
  with check (
    public.current_role() = 'coach'
    and session_id in (select id from public.sessions where coach_id = public.current_coach_id())
  );

create policy "school reads own cancellations" on public.cancellations
  for select using (
    public.current_role() = 'school'
    and session_id in (
      select s.id from public.sessions s
      join public.classes cl on cl.id = s.class_id
      where cl.school_id = public.current_school_id()
    )
  );

-- ---------- equipment ----------

create policy "admin full access equipment" on public.equipment
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads own school equipment" on public.equipment
  for select using (
    public.current_role() = 'coach'
    and school_id = (select assigned_school_id from public.coaches where id = public.current_coach_id())
  );

create policy "school reads own equipment" on public.equipment
  for select using (
    public.current_role() = 'school' and school_id = public.current_school_id()
  );

-- ---------- coach_attendance ----------

create policy "admin full access coach_attendance" on public.coach_attendance
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach manages own attendance" on public.coach_attendance
  for all using (
    public.current_role() = 'coach' and coach_id = public.current_coach_id()
  )
  with check (
    public.current_role() = 'coach' and coach_id = public.current_coach_id()
  );

create policy "school reads own coaches attendance" on public.coach_attendance
  for select using (
    public.current_role() = 'school'
    and coach_id in (select id from public.coaches where assigned_school_id = public.current_school_id())
  );

-- ---------- curriculum ----------

create policy "admin full access curriculum" on public.curriculum
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach manages own class curriculum" on public.curriculum
  for all using (
    public.current_role() = 'coach'
    and class_id in (select id from public.classes where coach_id = public.current_coach_id())
  )
  with check (
    public.current_role() = 'coach'
    and class_id in (select id from public.classes where coach_id = public.current_coach_id())
  );

create policy "school reads own curriculum" on public.curriculum
  for select using (
    public.current_role() = 'school'
    and class_id in (select id from public.classes where school_id = public.current_school_id())
  );
