import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso, readDb, writeDb } from "@/lib/db";
import { STUDENT_CLASSES } from "@/lib/studentClasses";
import type { Student } from "@/lib/types";

function normalizeStudent(raw: Partial<Student> & { id?: string }): Student {
  const fatherName = raw.fatherName || raw.guardianName || "";
  const motherName = raw.motherName || "";
  const parentPhone = raw.parentPhone || raw.guardianPhone || "";
  return {
    id: raw.id || newId(),
    name: (raw.name || "").trim(),
    gender: raw.gender || "other",
    dateOfBirth: raw.dateOfBirth || "",
    classLevel: raw.classLevel || "Play Group",
    fatherName,
    motherName,
    parentPhone,
    parentPhoneAlt: raw.parentPhoneAlt || "",
    address: raw.address || "Bodgaun, Indrawati-11",
    enrollmentDate: raw.enrollmentDate || nowIso().slice(0, 10),
    status: raw.status || "active",
    notes: raw.notes || "",
    createdAt: raw.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

export async function GET() {
  const db = await readDb();
  const students = db.students.map((s) => normalizeStudent(s));
  return jsonOk(students);
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Student>;
  if (!body.name || !body.classLevel) {
    return jsonError("Name and class are required");
  }
  if (!STUDENT_CLASSES.includes(body.classLevel as (typeof STUDENT_CLASSES)[number])) {
    return jsonError(
      `Class must be one of: ${STUDENT_CLASSES.join(", ")}`,
    );
  }
  if (!body.fatherName && !body.motherName && !body.guardianName) {
    return jsonError("Father or mother name is required");
  }
  if (!body.parentPhone && !body.guardianPhone) {
    return jsonError("Parent phone number is required");
  }
  const db = await readDb();
  const student = normalizeStudent(body);
  db.students.push(student);
  await writeDb(db);
  return jsonOk(student, 201);
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Student> & { id: string };
  if (!body.id) return jsonError("id required");
  const db = await readDb();
  const idx = db.students.findIndex((s) => s.id === body.id);
  if (idx < 0) return jsonError("Not found", 404);
  if (
    body.classLevel &&
    !STUDENT_CLASSES.includes(body.classLevel as (typeof STUDENT_CLASSES)[number])
  ) {
    return jsonError(
      `Class must be one of: ${STUDENT_CLASSES.join(", ")}`,
    );
  }
  const merged = normalizeStudent({
    ...db.students[idx],
    ...body,
    id: db.students[idx].id,
    createdAt: db.students[idx].createdAt,
  });
  db.students[idx] = merged;
  await writeDb(db);
  return jsonOk(merged);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");
  const db = await readDb();
  db.students = db.students.filter((s) => s.id !== id);
  await writeDb(db);
  return jsonOk({ ok: true });
}
