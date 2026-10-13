// Invites a single user via Supabase Auth's admin invite mechanism.
// Used directly (before the in-app invite UI exists) to seed the first few
// accounts, and to verify the signup trigger + RLS policies end-to-end.
//
// Usage: npx tsx scripts/invite-user.ts <email> <role> [coachId] [schoolId]
// Requires SUPABASE_SECRET_KEY (service-role) in env.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

const [, , email, role, coachId, schoolId] = process.argv;

if (!email || !role) {
  console.error("Usage: npx tsx scripts/invite-user.ts <email> <admin|coach|school> [coachId] [schoolId]");
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      role,
      coach_id: coachId || null,
      school_id: schoolId || null,
    },
  });
  if (error) throw error;
  console.log("Invited:", data.user.id, data.user.email);
}

main().catch((err) => {
  console.error("Invite failed:", err.message ?? err);
  process.exit(1);
});
