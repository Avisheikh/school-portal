import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "school.json");

const defaultDb: Database = {
  school: {
    name: "School of Social Development",
    shortName: "SOSD Bodgaun",
    location: "Bodgaun",
    ward: "Indrawati Rural Municipality – Ward 11",
    municipality: "Indrawati Rural Municipality",
    district: "Sindhupalchowk",
    established: "2021",
    phone: "",
    email: "info@ssd-bodgaun.org",
    about:
      "School of Social Development (SOSD) is a village education project in Bodgaun, Indrawati-11, Sindhupalchowk. Since 2021 we have grown a sky-blue campus among mustard fields — kindergarten, elementary learning, youth programmes and community care for children who deserve a fair start.",
    mission:
      "To give every child in Bodgaun learning, dignity and opportunity — and to invite friends near and far to invest in a village project that changes lifetimes.",
  },
  students: [
    {
      id: uuid(),
      name: "Sample Student",
      gender: "female",
      dateOfBirth: "2019-05-12",
      classLevel: "Play Group",
      fatherName: "Parent Father",
      motherName: "Parent Mother",
      parentPhone: "98XXXXXXXX",
      parentPhoneAlt: "",
      address: "Bodgaun, Ward 11",
      enrollmentDate: "2024-04-01",
      status: "active",
      notes: "Demo record — replace with real data",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  teachers: [
    {
      id: uuid(),
      name: "Sample Teacher",
      role: "Kindergarten Teacher",
      qualification: "B.Ed",
      photoUrl: "",
      phone: "98XXXXXXXX",
      email: "teacher@ssd-bodgaun.org",
      subjects: "Early Childhood, Literacy",
      joinDate: "2023-01-15",
      status: "active",
      bio: "Demo teacher profile",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  staff: [
    {
      id: uuid(),
      name: "Sample Staff",
      position: "School Coordinator",
      phone: "98XXXXXXXX",
      joinDate: "2022-06-01",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  attendance: [],
  activities: [
    {
      id: uuid(),
      title: "Welcome to the new campus",
      description:
        "Community gathering around the open-air theatre marking the school’s role as a village within a village.",
      date: "2022-10-01",
      category: "Community",
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  programs: [
    {
      id: uuid(),
      title: "Kindergarten (Foundation 1–3)",
      description:
        "Play-based early learning for about 50 children across three foundation levels — curiosity, literacy, numeracy, and social skills.",
      level: "Early Childhood",
      duration: "3 foundation years",
      capacity: 50,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: "Elementary (Grades 1–3)",
      description:
        "Holistic elementary programme inspired by IB practices, preparing learners for transition to government school from Grade 4.",
      level: "Elementary",
      duration: "Grades 1–3",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: "IT & Computer Literacy",
      description:
        "Bridging the digital divide with progressive computer skills for youth in Bodgaun.",
      level: "Youth / Community",
      duration: "Ongoing courses",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      title: "Youth Centre & Training Institute",
      description:
        "Skills, gatherings, and training hosted within the five-building campus ring.",
      level: "Community",
      duration: "Year-round",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

async function ensureDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<Database> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(raw) as Database;
}

export async function writeDb(db: Database): Promise<void> {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function newId(): string {
  return uuid();
}

export function nowIso(): string {
  return new Date().toISOString();
}
