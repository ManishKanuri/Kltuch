-- Logging a cancellation marks its session Cancelled in the same transaction.
-- The app used to send these as two separate writes, so a dropped connection
-- could leave a session cancelled with no reason on record, or a reason on
-- record for a session still shown as happening.
--
-- The update runs with the caller's permissions, so row-level security still
-- decides who may cancel what. If it changes no session, the insert is rolled
-- back rather than leaving a cancellation without its cancelled session.

create function public.mark_session_cancelled()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.sessions set status = 'Cancelled' where id = new.session_id;
  if not found then
    raise exception 'session % is missing or not editable by this user', new.session_id
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger cancellations_mark_session_cancelled
  after insert on public.cancellations
  for each row execute function public.mark_session_cancelled();
