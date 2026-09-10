export type Student = {
  id: string;
  name: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  /** Play Group → Nursery → LKG → UKG → Class 1 → Class 2 → Class 3 */
  classLevel: string;
  fatherName: string;
  motherName: string;
  parentPhone: string;
  parentPhoneAlt: string;
  address: string;
  enrollmentDate: string;
  status: "active" | "inactive" | "graduated";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** @deprecated kept for old records — prefer fatherName/motherName */
  guardianName?: string;
  guardianPhone?: string;
};

export type Teacher = {
  id: string;
  name: string;
  role: string;
  qualification: string;
  photoUrl: string;
  phone: string;
  email: string;
  subjects: string;
  joinDate: string;
  status: "active" | "inactive";
  bio?: string;
  createdAt: string;
  updatedAt: string;
};

export type Staff = {
  id: string;
  name: string;
  position: string;
  phone: string;
  joinDate: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export type AttendanceRecord = {
  id: string;
  personType: "staff" | "teacher";
  personId: string;
  personName: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  markedAt: string;
};

export type Activity = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Program = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  capacity?: number;
  status: "active" | "upcoming" | "completed";
  /** Program start / highlight date (YYYY-MM-DD) for yearly progress timeline */
  date?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type SchoolInfo = {
  name: string;
  shortName: string;
  location: string;
  ward: string;
  municipality: string;
  district: string;
  established: string;
  phone: string;
  email: string;
  about: string;
  mission: string;
};

/** Chart of accounts / sector head (e.g. Electricity, Donations) */
export type FinanceCategory = {
  id: string;
  code: string;
  name: string;
  type: "income" | "expense";
  sector: string;
  active: boolean;
  createdAt: string;
};

/**
 * Cash-book style entry for auditors:
 * Particular | Debit (kharcha) | Credit (aamdani) | Balance
 */
export type FinanceEntry = {
  id: string;
  date: string;
  voucherNo: string;
  particular: string;
  categoryId: string;
  categoryName: string;
  sector: string;
  type: "income" | "expense";
  debit: number;
  credit: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceDatabase = {
  categories: FinanceCategory[];
  entries: FinanceEntry[];
  openingBalance: number;
};

export type LedgerRow = FinanceEntry & { balance: number };

export type SectorSummary = {
  sector: string;
  type: "income" | "expense" | "mixed";
  debit: number;
  credit: number;
  net: number;
  count: number;
};

export type Database = {
  school: SchoolInfo;
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  attendance: AttendanceRecord[];
  activities: Activity[];
  programs: Program[];
};
