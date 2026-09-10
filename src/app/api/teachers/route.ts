import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso, readDb, writeDb } from "@/lib/db";
import type { Teacher } from "@/lib/types";

function normalize(t: Teacher): Teacher {
  return {
    ...t,
    qualification: t.qualification || "",
    photoUrl: t.photoUrl || "",
  };
}

export async function GET() {
  const db = await readDb();
  return jsonOk(db.teachers.map(normalize));
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Teacher>;
  if (!body.name || !body.role) return jsonError("Name and role are required");
  const db = await readDb();
  const teacher: Teacher = {
    id: newId(),
    name: body.name,
    role: body.role,
    qualification: body.qualification || "",
    photoUrl: body.photoUrl || "",
    phone: body.phone || "",
    email: body.email || "",
    subjects: body.subjects || "",
    joinDate: body.joinDate || nowIso().slice(0, 10),
    status: body.status || "active",
    bio: body.bio || "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.teachers.push(teacher);
  await writeDb(db);
  return jsonOk(teacher, 201);
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Teacher> & { id: string };
  if (!body.id) return jsonError("id required");
  const db = await readDb();
  const idx = db.teachers.findIndex((t) => t.id === body.id);
  if (idx < 0) return jsonError("Not found", 404);
  db.teachers[idx] = normalize({
    ...db.teachers[idx],
    ...body,
    id: db.teachers[idx].id,
    createdAt: db.teachers[idx].createdAt,
    updatedAt: nowIso(),
  });
  await writeDb(db);
  return jsonOk(db.teachers[idx]);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");
  const db = await readDb();
  db.teachers = db.teachers.filter((t) => t.id !== id);
  await writeDb(db);
  return jsonOk({ ok: true });
}
