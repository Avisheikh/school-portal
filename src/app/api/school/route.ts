import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { readDb, writeDb } from "@/lib/db";
import type { SchoolInfo } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  return jsonOk({
    school: db.school,
    stats: {
      students: db.students.filter((s) => s.status === "active").length,
      teachers: db.teachers.filter((t) => t.status === "active").length,
      staff: db.staff.filter((s) => s.status === "active").length,
      activities: db.activities.filter((a) => a.published).length,
      programs: db.programs.filter((p) => p.status === "active").length,
    },
  });
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<SchoolInfo>;
  const db = await readDb();
  db.school = { ...db.school, ...body };
  await writeDb(db);
  return jsonOk(db.school);
}
