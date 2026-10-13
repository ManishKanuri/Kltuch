// Additive seed for sessions, cancellations, equipment, coach_attendance,
// curriculum — run after seed-supabase.ts, which already created schools/
// coaches/classes. Looks up those real IDs by matching name/attributes
// rather than re-inserting them, since this script can be re-run without
// duplicating the base tables.
//
// Usage: npx tsx scripts/seed-remaining-tables.ts

import { createClient } from "@supabase/supabase-js";
import * as seed from "../src/lib/seed";
import type { Database } from "../src/lib/supabase/database.types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log("Looking up existing schools, coaches, classes...");
  const [{ data: schools, error: schoolsErr }, { data: coaches, error: coachesErr }, { data: classes, error: classesErr }] =
    await Promise.all([
      supabase.from("schools").select("id, name"),
      supabase.from("coaches").select("id, name"),
      supabase.from("classes").select("id, class_name, school_id, coach_id"),
    ]);
  if (schoolsErr) throw schoolsErr;
  if (coachesErr) throw coachesErr;
  if (classesErr) throw classesErr;

  const schoolIdByName = new Map(schools.map((s) => [s.name, s.id]));
  const coachIdByName = new Map(coaches.map((c) => [c.name, c.id]));
  // Classes aren't unique by name alone across schools — match by
  // (school_id, class_name) using the real IDs we just looked up.
  const classIdByKey = new Map(
    classes.map((c) => [`${c.school_id}::${c.class_name}`, c.id])
  );

  const seedSchoolIdToReal = new Map(
    seed.schools.map((s) => [s.id, schoolIdByName.get(s.name)!])
  );
  const seedCoachIdToReal = new Map(
    seed.coaches.map((c) => [c.id, coachIdByName.get(c.name)!])
  );
  const seedClassIdToReal = new Map(
    seed.classes.map((c) => {
      const realSchoolId = seedSchoolIdToReal.get(c.schoolId);
      const realClassId = classIdByKey.get(`${realSchoolId}::${c.className}`);
      return [c.id, realClassId!];
    })
  );

  for (const [seedId, realId] of seedClassIdToReal) {
    if (!realId) throw new Error(`Could not resolve real class id for seed class ${seedId}`);
  }

  console.log("Seeding sessions...");
  const sessionIdMap = new Map<string, string>();
  for (const s of seed.sessions) {
    const classId = seedClassIdToReal.get(s.classId);
    const coachId = seedCoachIdToReal.get(s.coachId);
    if (!classId || !coachId) throw new Error(`Unresolved class/coach for session ${s.id}`);
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        class_id: classId,
        coach_id: coachId,
        date: s.date,
        status: s.status,
        curriculum_week: s.curriculumWeek,
      })
      .select("id")
      .single();
    if (error) throw error;
    sessionIdMap.set(s.id, data.id);
  }
  console.log(`  ${sessionIdMap.size} sessions inserted.`);

  console.log("Seeding cancellations...");
  // seed.cancellations references session IDs that don't all exist in
  // seed.sessions (a pre-existing quirk in the mock data) — skip any that
  // don't resolve rather than inserting a broken foreign key.
  let cancellationsInserted = 0;
  for (const c of seed.cancellations) {
    const sessionId = sessionIdMap.get(c.sessionId);
    if (!sessionId) {
      console.log(`  skipping cancellation ${c.id} — no matching session in current seed set`);
      continue;
    }
    const { error } = await supabase.from("cancellations").insert({
      session_id: sessionId,
      cancelled_by: c.cancelledBy,
      reason: c.reason,
      rescheduled_date: c.rescheduledDate,
    });
    if (error) throw error;
    cancellationsInserted++;
  }
  console.log(`  ${cancellationsInserted} cancellations inserted.`);

  console.log("Seeding equipment...");
  const equipmentRows = seed.equipment.map((e) => {
    const schoolId = seedSchoolIdToReal.get(e.schoolId);
    if (!schoolId) throw new Error(`Unresolved school for equipment ${e.id}`);
    return {
      item_name: e.itemName,
      qty: e.qty,
      school_id: schoolId,
      condition: e.condition,
      date_issued: e.dateIssued,
      status: e.status,
    };
  });
  const { error: equipmentErr } = await supabase.from("equipment").insert(equipmentRows);
  if (equipmentErr) throw equipmentErr;
  console.log(`  ${equipmentRows.length} equipment rows inserted.`);

  console.log("Seeding coach_attendance...");
  const attendanceRows = seed.coachAttendance.map((a) => {
    const coachId = seedCoachIdToReal.get(a.coachId);
    if (!coachId) throw new Error(`Unresolved coach for attendance ${a.id}`);
    return { coach_id: coachId, date: a.date, present: a.present };
  });
  const { error: attendanceErr } = await supabase.from("coach_attendance").insert(attendanceRows);
  if (attendanceErr) throw attendanceErr;
  console.log(`  ${attendanceRows.length} attendance rows inserted.`);

  console.log("Seeding curriculum...");
  const curriculumRows = seed.curriculum.map((c) => {
    const classId = seedClassIdToReal.get(c.classId);
    if (!classId) throw new Error(`Unresolved class for curriculum ${c.classId}`);
    return {
      class_id: classId,
      current_week: c.currentWeek,
      total_weeks: c.totalWeeks,
      last_delivered: c.lastDelivered,
    };
  });
  const { error: curriculumErr } = await supabase.from("curriculum").insert(curriculumRows);
  if (curriculumErr) throw curriculumErr;
  console.log(`  ${curriculumRows.length} curriculum rows inserted.`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
