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

  // Without redirectTo, Supabase sends the user back to whatever Site URL is
  // configured in the dashboard — which may not match where this app is
  // actually running (e.g. localhost in dev). Setting it explicitly here
  // means the invite link works regardless of that dashboard setting,
  // as long as this exact URL is also in the project's allowed redirect list.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/login`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // The role is set here, by code that has verified an admin is asking — never
  // from metadata the invited person could edit.
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: data.user.id,
    role,
    coach_id: role === "coach" ? coachId! : null,
    school_id: role === "school" ? schoolId! : null,
    full_name: fullName ?? null,
  });

  if (profileError) {
    // Remove the half-created account so the admin can simply try again.
    await serviceClient.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ userId: data.user.id, email: data.user.email });
}
