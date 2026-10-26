// Loads the JGS PET programme: the school, four placeholder coaches (renamed
// later on the Coaches screen), the weekly timetable from the school's PDF,
// and the sessions for the first working period. Safe to rerun: rows that
// already exist, and coach assignments made in the app, are left alone.
//
//   set -a && source .env.local && set +a && npx tsx scripts/seed-jgs.ts

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { addDays, isoWeekday } from "../src/lib/dates";
import { PERIODS, PROGRAMME, TIMETABLE, gradeOf, planSession } from "../src/lib/programme";

const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

async function must<T>(query: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw error;
  if (data === null) throw new Error("no data returned");
  return data;
}

async function main() {
  // School
  let school = (await must(db.from("schools").select("*").eq("name", PROGRAMME.schoolName)))[0];
  if (!school) {
    school = await must(
      db
        .from("schools")
        .insert({ name: PROGRAMME.schoolName, address: "Mallapur, Hyderabad", contact_person: "To be confirmed" })
        .select("*")
        .single()
    );
    console.log("added the school");
  }

  // Coaches
  const coaches = await must(db.from("coaches").select("id").eq("assigned_school_id", school.id));
  if (!coaches.length) {
    await must(
      db.from("coaches").insert(
        [1, 2, 3, 4].map((n) => ({ name: `Coach ${n}`, phone: "", assigned_school_id: school.id, status: "Active" as const }))
      ).select("id")
    );
    console.log("added 4 placeholder coaches");
  }

  // Timetable
  await must(
    db.from("timetable_slots").upsert(
      TIMETABLE.map((slot) => ({
        school_id: school.id,
        weekday: slot.weekday,
        period: slot.period,
        start_time: PERIODS[slot.period].start,
        end_time: PERIODS[slot.period].end,
        group_label: slot.group,
        grade: gradeOf(slot.group),
      })),
      { onConflict: "school_id,weekday,period,group_label", ignoreDuplicates: true }
    ).select("id")
  );
  const slots = await must(db.from("timetable_slots").select("*").eq("school_id", school.id));
  console.log(`timetable: ${slots.length} weekly slots`);

  // Sessions for the first working period
  const rows: Database["public"]["Tables"]["pet_sessions"]["Insert"][] = [];
  for (let date: string = PROGRAMME.startDate; date <= PROGRAMME.firstLoadEnd; date = addDays(date, 1)) {
    for (const slot of slots.filter((s) => s.weekday === isoWeekday(date))) {
      const plan = planSession(date, { period: slot.period, group: slot.group_label, startTime: slot.start_time, endTime: slot.end_time });
      if (!plan) continue;
      rows.push({
        code: plan.code,
        school_id: school.id,
        slot_id: slot.id,
        date,
        period: plan.period,
        start_time: plan.startTime,
        end_time: plan.endTime,
        group_label: plan.groupLabel,
        grade: plan.grade,
        teaching_week: plan.teachingWeek,
        block: plan.block,
        week_in_block: plan.weekInBlock,
        sport: plan.sport,
        curriculum_code: plan.curriculumCode,
        lesson: plan.lesson,
        coach_id: slot.coach_id,
      });
    }
  }
  let added = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const made = await must(
      db.from("pet_sessions").upsert(rows.slice(i, i + 500), { onConflict: "code", ignoreDuplicates: true }).select("id")
    );
    added += made.length;
  }
  console.log(`sessions ${PROGRAMME.startDate} to ${PROGRAMME.firstLoadEnd}: ${rows.length} planned, ${added} added`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
