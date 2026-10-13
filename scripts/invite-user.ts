// Invites a user from the command line. Needed to bootstrap the first admin of
// a fresh environment (the in-app Team Access screen requires an admin login).
//
// Usage: npx tsx scripts/invite-user.ts <email> <admin|coach|school> [coachId] [schoolId]
// Requires SUPABASE_SECRET_KEY (service-role) in env.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

const [, , email, role, coachId, schoolId] = process.argv;

if (!email || !["admin", "coach", "school"].includes(role)) {
  console.error("Usage: npx tsx scripts/invite-user.ts <email> <admin|coach|school> [coachId] [schoolId]");
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/login`,
  });
  if (error) throw error;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role: role as "admin" | "coach" | "school",
    coach_id: role === "coach" ? coachId : null,
    school_id: role === "school" ? schoolId : null,
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }
  console.log("Invited:", data.user.id, data.user.email, `(${role})`);
}

main().catch((err) => {
  console.error("Invite failed:", err.message ?? err);
  process.exit(1);
});
