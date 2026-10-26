-- TEMPORARY: the pilot runs without sign-in until the team's emails are set up
-- (src/lib/access.ts). Until then the app reaches the database as the public
-- "anon" role, so anyone with the app's address can read and change these
-- tables. No student data is stored, and the demo-only tables (sessions,
-- classes, assessments …) get no access. Nothing here allows deleting
-- sessions, coaches or the timetable; attendance marks can be cleared.
--
-- To bring sign-in back: set OPEN_ACCESS to false and add a migration that
-- drops every policy named "open pilot …" below.

create policy "open pilot reads schools" on public.schools
  for select to anon using (true);

create policy "open pilot reads coaches" on public.coaches
  for select to anon using (true);
create policy "open pilot adds coaches" on public.coaches
  for insert to anon with check (true);
create policy "open pilot edits coaches" on public.coaches
  for update to anon using (true) with check (true);

create policy "open pilot reads attendance" on public.coach_attendance
  for select to anon using (true);
create policy "open pilot marks attendance" on public.coach_attendance
  for insert to anon with check (true);
create policy "open pilot edits attendance" on public.coach_attendance
  for update to anon using (true) with check (true);
create policy "open pilot clears attendance" on public.coach_attendance
  for delete to anon using (true);

create policy "open pilot reads timetable" on public.timetable_slots
  for select to anon using (true);
create policy "open pilot adds timetable slots" on public.timetable_slots
  for insert to anon with check (true);
create policy "open pilot edits timetable" on public.timetable_slots
  for update to anon using (true) with check (true);

create policy "open pilot reads sessions" on public.pet_sessions
  for select to anon using (true);
create policy "open pilot adds sessions" on public.pet_sessions
  for insert to anon with check (true);
create policy "open pilot reports sessions" on public.pet_sessions
  for update to anon using (true) with check (true);
