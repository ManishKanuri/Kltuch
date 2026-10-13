-- Live updates (blueprint §7): stream row changes on the tables people edit
-- during a school day. Realtime applies each table's RLS policies per
-- subscriber, so a coach only receives changes to rows they can already read.
alter publication supabase_realtime add table
  public.sessions,
  public.coach_attendance,
  public.cancellations,
  public.assessments,
  public.equipment,
  public.coaches,
  public.curriculum;
