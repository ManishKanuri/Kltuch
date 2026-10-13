// One-time seed: loads src/lib/seed.ts + fitnessSeed.ts demo data into the
// real Supabase tables created by the Phase 1 migration. Mock string IDs
// (e.g. "sch_abc") are mapped to generated UUIDs as rows are inserted, since
// the DB schema uses uuid primary keys.
//
// Usage: npx tsx scripts/seed-supabase.ts
// Requires SUPABASE_SECRET_KEY in .env.local (service-role — bypasses RLS,
// server-only, never used in application code).

import { createClient } from "@supabase/supabase-js";
import * as seed from "../src/lib/seed";
import { fitnessAssessments } from "../src/lib/fitnessSeed";
import type { Database } from "../src/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env.");
  process.exit(1);
}

const supabase = createClient<Database>(url, secretKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Seeding schools...");
  const schoolIdMap = new Map<string, string>();
  for (const school of seed.schools) {
    const { data, error } = await supabase
      .from("schools")
      .insert({ name: school.name, address: school.address, contact_person: school.contactPerson })
      .select("id")
      .single();
    if (error) throw error;
    schoolIdMap.set(school.id, data.id);
  }
  console.log(`  ${schoolIdMap.size} schools inserted.`);

  console.log("Seeding coaches...");
  const coachIdMap = new Map<string, string>();
  for (const coach of seed.coaches) {
    const schoolId = schoolIdMap.get(coach.assignedSchoolId);
    if (!schoolId) throw new Error(`Unknown school ${coach.assignedSchoolId} for coach ${coach.id}`);
    const { data, error } = await supabase
      .from("coaches")
      .insert({
        name: coach.name,
        phone: coach.phone,
        assigned_school_id: schoolId,
        status: coach.status,
        rating: coach.rating,
      })
      .select("id")
      .single();
    if (error) throw error;
    coachIdMap.set(coach.id, data.id);
  }
  console.log(`  ${coachIdMap.size} coaches inserted.`);

  console.log("Seeding classes...");
  const classIdMap = new Map<string, string>();
  for (const classroom of seed.classes) {
    const schoolId = schoolIdMap.get(classroom.schoolId);
    const coachId = coachIdMap.get(classroom.coachId);
    if (!schoolId || !coachId) throw new Error(`Unknown school/coach for class ${classroom.id}`);
    const { data, error } = await supabase
      .from("classes")
      .insert({
        school_id: schoolId,
        class_name: classroom.className,
        section: classroom.section,
        coach_id: coachId,
        sport: classroom.sport,
      })
      .select("id")
      .single();
    if (error) throw error;
    classIdMap.set(classroom.id, data.id);
  }
  console.log(`  ${classIdMap.size} classes inserted.`);

  console.log("Seeding assessments...");
  const assessmentRows = seed.assessments.map((a) => {
    const classId = classIdMap.get(a.classId);
    if (!classId) throw new Error(`Unknown class ${a.classId} for assessment ${a.id}`);
    return {
      student_name: a.studentName,
      class_id: classId,
      term: a.term,
      ratings: a.ratings,
      date: a.date,
    };
  });
  const { error: assessmentsError } = await supabase.from("assessments").insert(assessmentRows);
  if (assessmentsError) throw assessmentsError;
  console.log(`  ${assessmentRows.length} assessments inserted.`);

  console.log("Seeding fitness_assessments (1,000 synthetic rows)...");
  const fitnessRows = fitnessAssessments.map((f) => {
    const schoolId = schoolIdMap.get(f.schoolId);
    if (!schoolId) throw new Error(`Unknown school ${f.schoolId} for fitness record ${f.id}`);
    return {
      student_id: f.studentId,
      student_name: f.studentName,
      school_id: schoolId,
      age: f.age,
      grade: f.grade,
      section: f.section,
      class_name: f.className,
      gender: f.gender,
      date: f.date,
      speed_50m_seconds: f.speed50mSeconds,
      stamina_600m_seconds: f.stamina600mSeconds,
      toe_touch_cm: f.toeTouchCm,
      push_ups: f.pushUps,
      curls: f.curls,
      height_cm: f.heightCm,
      weight_kg: f.weightKg,
      bmi: f.bmi,
      attendance_rate: f.attendanceRate,
      sessions_scheduled: f.sessionsScheduled,
      sessions_finished: f.sessionsFinished,
      sessions_missed: f.sessionsMissed,
    };
  });
  // Insert in batches — 1,000 rows in one request risks payload/timeout limits.
  const batchSize = 200;
  for (let i = 0; i < fitnessRows.length; i += batchSize) {
    const batch = fitnessRows.slice(i, i + batchSize);
    const { error } = await supabase.from("fitness_assessments").insert(batch);
    if (error) throw error;
    console.log(`  inserted ${Math.min(i + batchSize, fitnessRows.length)}/${fitnessRows.length}`);
  }

  console.log("\nDone. Seeded:");
  console.log(`  schools: ${schoolIdMap.size}`);
  console.log(`  coaches: ${coachIdMap.size}`);
  console.log(`  classes: ${classIdMap.size}`);
  console.log(`  assessments: ${assessmentRows.length}`);
  console.log(`  fitness_assessments: ${fitnessRows.length}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
