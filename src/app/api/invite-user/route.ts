import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

// Server-only: invites a user via Supabase Auth and tags them with the role/
// scope an admin assigns. Requires SUPABASE_SECRET_KEY (service-role), which
// must never be sent to the browser — this route is the only place it's used
// outside one-off scripts.
export async function POST(request: Request) {
  // 1. Confirm the caller is an authenticated admin (via their session cookie
  // + RLS-protected profiles read), before touching the service-role client.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // 2. Validate the request body.
  const body = await request.json();
  const { email, role, coachId, schoolId, fullName } = body as {
    email?: string;
    role?: "admin" | "coach" | "school";
    coachId?: string;
    schoolId?: string;
    fullName?: string;
  };

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }
  if (role === "coach" && !coachId) {
    return NextResponse.json({ error: "coachId is required for the coach role" }, { status: 400 });
  }
  if (role === "school" && !schoolId) {
    return NextResponse.json({ error: "schoolId is required for the school role" }, { status: 400 });
  }

  // 3. Invite with the service-role client — this is the one place it's safe
  // to use it, since we've already verified the caller is a real admin above.
  const serviceClient = createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: {
      role,
      coach_id: coachId ?? null,
      school_id: schoolId ?? null,
      full_name: fullName ?? null,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ userId: data.user.id, email: data.user.email });
}
