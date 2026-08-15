import { mkdirSync, writeFileSync } from "node:fs";

// Deterministic synthetic data: safe to regenerate and contains no real student PII.
let state = 20260815;
const random = () => {
  state = (state * 1664525 + 1013904223) >>> 0;
  return state / 4294967296;
};
const normal = () => {
  const u = Math.max(random(), 1e-9);
  const v = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, places = 1) => Number(value.toFixed(places));
const femaleFirstNames = ["Aadhya", "Aditi", "Ananya", "Bhavya", "Diya", "Esha", "Ishita", "Kavya", "Kiara", "Meera", "Myra", "Navya", "Nisha", "Rhea", "Riya", "Saanvi", "Sara", "Siya", "Tanvi", "Tara", "Zara", "Aarohi"];
const maleFirstNames = ["Aarav", "Advait", "Arjun", "Ayaan", "Dhruv", "Ishaan", "Kabir", "Kian", "Manav", "Neel", "Pranav", "Rishabh", "Rohan", "Samar", "Shaurya", "Ved", "Vihaan", "Yash"];
const lastNames = [
  "Agarwal", "Bhat", "Chatterjee", "Das", "Desai", "Gupta", "Iyer", "Jain",
  "Kapoor", "Khan", "Kulkarni", "Menon", "Mehta", "Mishra", "Mukherjee", "Nair",
  "Patel", "Pillai", "Rao", "Reddy", "Roy", "Shah", "Sharma", "Singh", "Sinha",
  "Subramanian", "Verma", "Yadav", "Banerjee", "Joshi",
];

const header = [
  "student_id",
  "student_name",
  "gender",
  "school_id",
  "age_years",
  "grade",
  "section",
  "class_name",
  "assessment_date",
  "speed_50m_dash_seconds",
  "stamina_600m_run_walk_seconds",
  "flexibility_forward_toe_touch_cm",
  "upper_body_strength_push_ups_reps",
  "abdominal_strength_curls_reps",
  "height_cm",
  "weight_kg",
  "bmi_kg_m2",
  "attendance_percent",
  "sessions_scheduled",
  "sessions_finished",
  "sessions_missed",
].join(",");

const rows = [header];
for (let index = 1; index <= 1000; index += 1) {
  const age = 8 + Math.floor(random() * 10);
  const grade = Math.min(12, Math.max(3, age - 5));
  const athleticism = normal();
  const height = clamp(112 + age * 4.45 + normal() * 6.5, 120, 190);
  const bmiTarget = clamp(17.2 + (age - 8) * 0.25 + normal() * 2.5, 13.5, 31.5);
  const weight = (bmiTarget * (height / 100) ** 2);
  const bmi = weight / (height / 100) ** 2;
  const gender = index % 2 === 0 ? "Male" : "Female";
  const section = ["A", "B", "C"][Math.floor((index - 1) / 3) % 3];
  const sessionsScheduled = 18 + (index % 9);
  const attendanceRate = 75 + ((index * 13) % 23);
  const sessionsMissed = Math.round(sessionsScheduled * (100 - attendanceRate) / 100);

  const speed = clamp(15.4 - (age - 8) * 0.38 - athleticism * 0.62 + normal() * 0.48, 6.8, 17.5);
  const stamina = clamp(430 - (age - 8) * 17 - athleticism * 25 + normal() * 26, 130, 570);
  const flexibility = clamp(0 + (age - 8) * 0.45 + athleticism * 2.6 + normal() * 5.5, -18, 30);
  const pushUps = clamp(3 + (age - 8) * 1.7 + athleticism * 3.0 + normal() * 3.2, 0, 50);
  const curls = clamp(12 + (age - 8) * 2.1 + athleticism * 3.8 + normal() * 4.2, 2, 75);

  rows.push([
    `STU-${String(index).padStart(4, "0")}`,
    `${(gender === "Female" ? femaleFirstNames : maleFirstNames)[(index * 17 + 3) % (gender === "Female" ? femaleFirstNames.length : maleFirstNames.length)]} ${lastNames[(index * 11 + 7) % lastNames.length]}`,
    gender,
    ["sch_abc", "sch_xyz", "sch_mno"][(index - 1) % 3],
    age,
    grade,
    section,
    `Class ${grade}${section}`,
    "2026-08-01",
    round(speed),
    Math.round(stamina),
    round(flexibility),
    Math.round(pushUps),
    Math.round(curls),
    round(height),
    round(weight),
    round(bmi),
    attendanceRate,
    sessionsScheduled,
    sessionsScheduled - sessionsMissed,
    sessionsMissed,
  ].join(","));
}

mkdirSync("data", { recursive: true });
writeFileSync("data/cisce-fitness-assessments-1000-students.csv", `${rows.join("\n")}\n`);
