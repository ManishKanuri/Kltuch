// TEMPORARY: sign-in is off for the pilot until the team's emails are set up.
// Anyone with the app's address picks a view (admin, a coach, or the school)
// and can use it; the database allows this through the "open pilot" policies.
//
// To bring sign-in back: set this to false, then add a migration that drops
// those policies (see supabase/migrations/*_open_access_pilot.sql).
export const OPEN_ACCESS = true;
