-- JGS rotates Football, Basketball and Volleyball. A new enum value can't be
-- used in the transaction that adds it, so it gets a migration of its own.
alter type public.sport add value if not exists 'Volleyball';
