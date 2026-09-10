import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso, readDb, writeDb } from "@/lib/db";
import type { Program } from "@/lib/types";

export async function GET() {
  const db = await readDb();
  return jsonOk(db.programs);
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Program>;
  if (!body.title) return jsonError("Title is required");
  const db = await readDb();
  const program: Program = {
    id: newId(),
    title: body.title,
    description: body.description || "",
    level: body.level || "",
    duration: body.duration || "",
    capacity: body.capacity,
    status: body.status || "active",
    date: body.date || "",
    imageUrl: body.imageUrl || "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.programs.push(program);
  await writeDb(db);
  return jsonOk(program, 201);
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Program> & { id: string };
  if (!body.id) return jsonError("id required");
  const db = await readDb();
  const idx = db.programs.findIndex((p) => p.id === body.id);
  if (idx < 0) return jsonError("Not found", 404);
  db.programs[idx] = {
    ...db.programs[idx],
    ...body,
    id: db.programs[idx].id,
    createdAt: db.programs[idx].createdAt,
    updatedAt: nowIso(),
  };
  await writeDb(db);
  return jsonOk(db.programs[idx]);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");
  const db = await readDb();
  db.programs = db.programs.filter((p) => p.id !== id);
  await writeDb(db);
  return jsonOk({ ok: true });
}
