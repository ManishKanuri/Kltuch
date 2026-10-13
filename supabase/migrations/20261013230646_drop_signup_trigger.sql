-- Roles are assigned only by trusted server code now: the invite API inserts
-- the profiles row after verifying the caller is an admin. The old trigger read
-- the role from signup metadata, which the person signing up controls, so a
-- self-registered user could have made themselves an admin.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
