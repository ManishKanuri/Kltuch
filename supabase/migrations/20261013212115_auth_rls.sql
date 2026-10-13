-- KLUTCH SportsEd — Phase 4: profiles signup trigger + RLS policies
-- See docs/PRODUCTION_BLUEPRINT.md §5. Every table enabled RLS in the Phase 1
-- migration with zero policies (default-deny); this migration adds the
-- actual access rules from the §5.2 matrix.

-- ---------- profiles signup trigger ----------
-- Admin invites a user via supabase.auth.admin.inviteUserByEmail(email, {
--   data: { role, coach_id, school_id, full_name }
-- }). When that user completes signup, this trigger reads that metadata off
-- auth.users and creates the matching profiles row automatically.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, coach_id, school_id, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.role, 'coach'),
    nullif(new.raw_user_meta_data->>'coach_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- helper: current caller's profile fields ----------
-- Wrapping the lookup once keeps every policy below short and consistent,
-- and avoids re-querying profiles inside every single policy clause.

create function public.current_role()
returns public.role
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.current_coach_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select coach_id from public.profiles where id = auth.uid();
$$;

create function public.current_school_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

-- ---------- profiles ----------
-- Everyone can read their own profile (needed to know their own role/scope
-- client-side); only admins can read/manage everyone else's.

create policy "read own profile" on public.profiles
  for select using (id = auth.uid());

create policy "admin reads all profiles" on public.profiles
  for select using (public.current_role() = 'admin');

create policy "admin manages profiles" on public.profiles
  for insert with check (public.current_role() = 'admin');

create policy "admin updates profiles" on public.profiles
  for update using (public.current_role() = 'admin');

-- ---------- schools ----------

create policy "admin full access schools" on public.schools
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads assigned school" on public.schools
  for select using (
    public.current_role() = 'coach'
    and id = (select assigned_school_id from public.coaches where id = public.current_coach_id())
  );

create policy "school reads own school" on public.schools
  for select using (
    public.current_role() = 'school' and id = public.current_school_id()
  );

-- ---------- coaches ----------

create policy "admin full access coaches" on public.coaches
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads self" on public.coaches
  for select using (
    public.current_role() = 'coach' and id = public.current_coach_id()
  );

create policy "school reads own coaches" on public.coaches
  for select using (
    public.current_role() = 'school' and assigned_school_id = public.current_school_id()
  );

-- ---------- classes ----------

create policy "admin full access classes" on public.classes
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach reads own classes" on public.classes
  for select using (
    public.current_role() = 'coach' and coach_id = public.current_coach_id()
  );

create policy "school reads own classes" on public.classes
  for select using (
    public.current_role() = 'school' and school_id = public.current_school_id()
  );

-- ---------- assessments ----------
-- Scoped through classes (assessments don't carry school_id/coach_id
-- directly — join back through class_id per the §4.1 schema).

create policy "admin full access assessments" on public.assessments
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach manages own class assessments" on public.assessments
  for all using (
    public.current_role() = 'coach'
    and class_id in (select id from public.classes where coach_id = public.current_coach_id())
  )
  with check (
    public.current_role() = 'coach'
    and class_id in (select id from public.classes where coach_id = public.current_coach_id())
  );

create policy "school reads own assessments" on public.assessments
  for select using (
    public.current_role() = 'school'
    and class_id in (select id from public.classes where school_id = public.current_school_id())
  );

-- ---------- fitness_assessments ----------

create policy "admin full access fitness_assessments" on public.fitness_assessments
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "coach manages own school fitness_assessments" on public.fitness_assessments
  for all using (
    public.current_role() = 'coach'
    and school_id = (select assigned_school_id from public.coaches where id = public.current_coach_id())
  )
  with check (
    public.current_role() = 'coach'
    and school_id = (select assigned_school_id from public.coaches where id = public.current_coach_id())
  );

create policy "school reads own fitness_assessments" on public.fitness_assessments
  for select using (
    public.current_role() = 'school' and school_id = public.current_school_id()
  );
