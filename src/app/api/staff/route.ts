import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso, readDb, writeDb } from "@/lib/db";
import type { Staff } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  return jsonOk(db.staff);
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Staff>;
  if (!body.name || !body.position) {
    return jsonError("Name and position are required");
  }
  const db = await readDb();
  const staff: Staff = {
    id: newId(),
    name: body.name,
    position: body.position,
    phone: body.phone || "",
    joinDate: body.joinDate || nowIso().slice(0, 10),
    status: body.status || "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.staff.push(staff);
  await writeDb(db);
  return jsonOk(staff, 201);
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Staff> & { id: string };
  if (!body.id) return jsonError("id required");
  const db = await readDb();
  const idx = db.staff.findIndex((s) => s.id === body.id);
  if (idx < 0) return jsonError("Not found", 404);
  db.staff[idx] = {
    ...db.staff[idx],
    ...body,
    id: db.staff[idx].id,
    createdAt: db.staff[idx].createdAt,
    updatedAt: nowIso(),
  };
  await writeDb(db);
  return jsonOk(db.staff[idx]);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");
  const db = await readDb();
  db.staff = db.staff.filter((s) => s.id !== id);
  await writeDb(db);
  return jsonOk({ ok: true });
}
