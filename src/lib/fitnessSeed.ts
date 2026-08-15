import type { FitnessAssessment } from "./types";

// Synthetic, deterministic companion to data/cisce-fitness-assessments-1000-students.csv.
// It contains no real student information and lets the demo work without CSV parsing.
const femaleFirstNames = ["Aadhya", "Aditi", "Ananya", "Bhavya", "Diya", "Esha", "Ishita", "Kavya", "Kiara", "Meera", "Myra", "Navya", "Nisha", "Rhea", "Riya", "Saanvi", "Sara", "Siya", "Tanvi", "Tara", "Zara", "Aarohi"];
const maleFirstNames = ["Aarav", "Advait", "Arjun", "Ayaan", "Dhruv", "Ishaan", "Kabir", "Kian", "Manav", "Neel", "Pranav", "Rishabh", "Rohan", "Samar", "Shaurya", "Ved", "Vihaan", "Yash"];
const lastNames = ["Agarwal", "Bhat", "Chatterjee", "Das", "Desai", "Gupta", "Iyer", "Jain", "Kapoor", "Khan", "Kulkarni", "Menon", "Mehta", "Mishra", "Mukherjee", "Nair", "Patel", "Pillai", "Rao", "Reddy", "Roy", "Shah", "Sharma", "Singh", "Sinha", "Subramanian", "Verma", "Yadav", "Banerjee", "Joshi"];
const schoolIds = ["sch_abc", "sch_xyz", "sch_mno"];

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
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, places = 1) => Number(n.toFixed(places));

export const fitnessAssessments: FitnessAssessment[] = Array.from({ length: 1000 }, (_, offset) => {
  const index = offset + 1;
  const age = 8 + Math.floor(random() * 10);
  const grade = Math.min(12, Math.max(3, age - 5));
  const athleticism = normal();
  const heightCm = clamp(112 + age * 4.45 + normal() * 6.5, 120, 190);
  const bmiTarget = clamp(17.2 + (age - 8) * 0.25 + normal() * 2.5, 13.5, 31.5);
  const weightKg = bmiTarget * (heightCm / 100) ** 2;
  const gender = index % 2 === 0 ? "Male" as const : "Female" as const;
  const section = (["A", "B", "C"] as const)[Math.floor((index - 1) / 3) % 3];
  const sessionsScheduled = 18 + (index % 9);
  const attendanceRate = 75 + ((index * 13) % 23);
  const sessionsMissed = Math.round(sessionsScheduled * (100 - attendanceRate) / 100);
  return {
    id: `fit_${String(index).padStart(4, "0")}`,
    studentId: `STU-${String(index).padStart(4, "0")}`,
    studentName: `${(gender === "Female" ? femaleFirstNames : maleFirstNames)[(index * 17 + 3) % (gender === "Female" ? femaleFirstNames.length : maleFirstNames.length)]} ${lastNames[(index * 11 + 7) % lastNames.length]}`,
    schoolId: schoolIds[(index - 1) % schoolIds.length],
    age,
    grade,
    section,
    className: `Class ${grade}${section}`,
    gender,
    date: "2026-08-01",
    speed50mSeconds: round(clamp(15.4 - (age - 8) * 0.38 - athleticism * 0.62 + normal() * 0.48, 6.8, 17.5)),
    stamina600mSeconds: Math.round(clamp(430 - (age - 8) * 17 - athleticism * 25 + normal() * 26, 130, 570)),
    toeTouchCm: round(clamp((age - 8) * 0.45 + athleticism * 2.6 + normal() * 5.5, -18, 30)),
    pushUps: Math.round(clamp(3 + (age - 8) * 1.7 + athleticism * 3 + normal() * 3.2, 0, 50)),
    curls: Math.round(clamp(12 + (age - 8) * 2.1 + athleticism * 3.8 + normal() * 4.2, 2, 75)),
    heightCm: round(heightCm),
    weightKg: round(weightKg),
    bmi: round(weightKg / (heightCm / 100) ** 2),
    attendanceRate,
    sessionsScheduled,
    sessionsFinished: sessionsScheduled - sessionsMissed,
    sessionsMissed,
  };
});
