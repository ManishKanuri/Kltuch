import type {
  Assessment,
  Cancellation,
  CancellationRow,
  ClassRoom,
  Coach,
  CoachAttendance,
  CurriculumWeek,
  Equipment,
  School,
  Session,
} from "./types";


export const schools: School[] = [
  {
    id: "sch_abc",
    name: "ABC School",
    address: "12 MG Road, Bengaluru",
    contactPerson: "Mr. Rakesh Iyer",
  },
  {
    id: "sch_xyz",
    name: "XYZ School",
    address: "45 Residency Rd, Bengaluru",
    contactPerson: "Ms. Sunita Rao",
  },
  {
    id: "sch_mno",
    name: "MNO School",
    address: "8 Brigade Layout, Bengaluru",
    contactPerson: "Mr. David Thomas",
  },
];

export const coaches: Coach[] = [
  {
    id: "co_ravi",
    name: "Ravi Kumar",
    phone: "+91 98450 11223",
    assignedSchoolId: "sch_abc",
    status: "Active",
    rating: 4,
  },
  {
    id: "co_priya",
    name: "Priya Singh",
    phone: "+91 98450 44556",
    assignedSchoolId: "sch_xyz",
    status: "Active",
    rating: 5,
  },
  {
    id: "co_arjun",
    name: "Arjun Rao",
    phone: "+91 98450 77889",
    assignedSchoolId: "sch_mno",
    status: "Active",
    rating: 3,
  },
  {
    id: "co_meena",
    name: "Meena Devi",
    phone: "+91 98450 99001",
    assignedSchoolId: "sch_abc",
    status: "Active",
    rating: 4,
  },
];

export const classes: ClassRoom[] = [
  { id: "cl_abc_5a", schoolId: "sch_abc", className: "Class 5A", section: "A", coachId: "co_ravi", sport: "Football" },
  { id: "cl_abc_5b", schoolId: "sch_abc", className: "Class 5B", section: "B", coachId: "co_ravi", sport: "Football" },
  { id: "cl_abc_4a", schoolId: "sch_abc", className: "Class 4A", section: "A", coachId: "co_meena", sport: "Basketball" },
  { id: "cl_abc_7a", schoolId: "sch_abc", className: "Class 7A", section: "A", coachId: "co_meena", sport: "Tennis" },
  { id: "cl_abc_3a", schoolId: "sch_abc", className: "Class 3A", section: "A", coachId: "co_ravi", sport: "Football" },
  { id: "cl_abc_3b", schoolId: "sch_abc", className: "Class 3B", section: "B", coachId: "co_meena", sport: "Basketball" },
  { id: "cl_xyz_6a", schoolId: "sch_xyz", className: "Class 6A", section: "A", coachId: "co_priya", sport: "Basketball" },
  { id: "cl_xyz_7a", schoolId: "sch_xyz", className: "Class 7A", section: "A", coachId: "co_priya", sport: "Tennis" },
  { id: "cl_xyz_5b", schoolId: "sch_xyz", className: "Class 5B", section: "B", coachId: "co_priya", sport: "Football" },
  { id: "cl_mno_7b", schoolId: "sch_mno", className: "Class 7B", section: "B", coachId: "co_arjun", sport: "Basketball" },
];

export const sessions: Session[] = [
  { id: "se_1", classId: "cl_abc_5a", date: "2025-06-02", status: "Done", curriculumWeek: 4, coachId: "co_ravi" },
  { id: "se_2", classId: "cl_abc_5b", date: "2025-06-02", status: "Done", curriculumWeek: 4, coachId: "co_ravi" },
  { id: "se_3", classId: "cl_xyz_6a", date: "2025-06-02", status: "Cancelled", curriculumWeek: 3, coachId: "co_priya" },
  { id: "se_4", classId: "cl_xyz_7a", date: "2025-06-02", status: "Pending", curriculumWeek: 3, coachId: "co_priya" },
  { id: "se_5", classId: "cl_mno_7b", date: "2025-06-02", status: "Pending", curriculumWeek: 5, coachId: "co_arjun" },
  { id: "se_6", classId: "cl_abc_4a", date: "2025-06-02", status: "Done", curriculumWeek: 4, coachId: "co_meena" },
  { id: "se_7", classId: "cl_abc_7a", date: "2025-06-02", status: "Pending", curriculumWeek: 4, coachId: "co_meena" },
  { id: "se_8", classId: "cl_abc_3a", date: "2025-06-01", status: "Done", curriculumWeek: 4, coachId: "co_ravi" },
];

export const cancellations: Cancellation[] = [
  { id: "ca_1", sessionId: "se_abc_6a_28may", cancelledBy: "School", reason: "School event", rescheduledDate: "2025-06-04" },
  { id: "ca_2", sessionId: "se_xyz_5b_30may", cancelledBy: "School", reason: "Exam prep", rescheduledDate: null },
  { id: "ca_3", sessionId: "se_abc_7a_1jun", cancelledBy: "KLUTCH", reason: "Coach sick", rescheduledDate: "2025-06-05" },
  { id: "ca_4", sessionId: "se_3", cancelledBy: "School", reason: "Ground unavailable", rescheduledDate: null },
];

// cancellation-log display rows keep denormalized context for the table
export const cancellationRows: CancellationRow[] = [
  { id: "ca_1", date: "2025-05-28", schoolId: "sch_abc", className: "Class 6A", cancelledBy: "School", reason: "School event", rescheduledDate: "2025-06-04" },
  { id: "ca_2", date: "2025-05-30", schoolId: "sch_xyz", className: "Class 5B", cancelledBy: "School", reason: "Exam prep", rescheduledDate: null },
  { id: "ca_3", date: "2025-06-01", schoolId: "sch_abc", className: "Class 7A", cancelledBy: "KLUTCH", reason: "Coach sick", rescheduledDate: "2025-06-05" },
];

export const assessments: Assessment[] = [
  {
    id: "as_1",
    studentName: "Aryan Shah",
    classId: "cl_abc_3a",
    term: "Term 1",
    ratings: { motorSkills: 4, coordination: 3, fitness: 4, attitude: 5 },
    date: "2025-05-20",
  },
  {
    id: "as_2",
    studentName: "Priya Nair",
    classId: "cl_abc_3a",
    term: "Term 1",
    ratings: { motorSkills: 3, coordination: 4, fitness: 3, attitude: 4 },
    date: "2025-05-20",
  },
  {
    id: "as_3",
    studentName: "Rohan Mehta",
    classId: "cl_abc_3b",
    term: "Term 1",
    ratings: { motorSkills: 5, coordination: 5, fitness: 5, attitude: 5 },
    date: "2025-05-21",
  },
  {
    id: "as_4",
    studentName: "Sara Khan",
    classId: "cl_xyz_5b",
    term: "Term 1",
    ratings: { motorSkills: 3, coordination: 3, fitness: 4, attitude: 3 },
    date: "2025-05-22",
  },
];

export const equipment: Equipment[] = [
  { id: "eq_1", itemName: "Football (Size 4)", qty: 4, schoolId: "sch_abc", condition: "Good", dateIssued: "2025-06-01", status: "Active" },
  { id: "eq_2", itemName: "Cones (set of 20)", qty: 2, schoolId: "sch_abc", condition: "Good", dateIssued: "2025-06-01", status: "Active" },
  { id: "eq_3", itemName: "Foam Balls", qty: 6, schoolId: "sch_xyz", condition: "Fair", dateIssued: "2025-06-05", status: "Active" },
  { id: "eq_4", itemName: "Bibs (set of 10)", qty: 1, schoolId: "sch_xyz", condition: "Damaged", dateIssued: "2025-06-05", status: "Replace" },
  { id: "eq_5", itemName: "Agility Ladder", qty: 3, schoolId: "sch_mno", condition: "Good", dateIssued: "2025-06-03", status: "Active" },
];

export const coachAttendance: CoachAttendance[] = [
  { id: "at_1", coachId: "co_ravi", date: "2025-06-02", present: true },
  { id: "at_2", coachId: "co_priya", date: "2025-06-02", present: true },
  { id: "at_3", coachId: "co_arjun", date: "2025-06-02", present: true },
  { id: "at_4", coachId: "co_meena", date: "2025-06-02", present: true },
];

export const curriculum: CurriculumWeek[] = [
  { classId: "cl_abc_5a", currentWeek: 4, totalWeeks: 12, lastDelivered: "2025-06-02" },
  { classId: "cl_abc_5b", currentWeek: 4, totalWeeks: 12, lastDelivered: "2025-06-02" },
  { classId: "cl_abc_4a", currentWeek: 4, totalWeeks: 12, lastDelivered: "2025-06-02" },
  { classId: "cl_abc_7a", currentWeek: 4, totalWeeks: 12, lastDelivered: "2025-05-26" },
  { classId: "cl_abc_3a", currentWeek: 4, totalWeeks: 12, lastDelivered: "2025-06-01" },
  { classId: "cl_abc_3b", currentWeek: 3, totalWeeks: 12, lastDelivered: "2025-05-28" },
  { classId: "cl_xyz_6a", currentWeek: 3, totalWeeks: 12, lastDelivered: "2025-05-26" },
  { classId: "cl_xyz_7a", currentWeek: 3, totalWeeks: 12, lastDelivered: "2025-05-26" },
  { classId: "cl_xyz_5b", currentWeek: 3, totalWeeks: 12, lastDelivered: "2025-05-26" },
  { classId: "cl_mno_7b", currentWeek: 5, totalWeeks: 12, lastDelivered: "2025-05-27" },
];
