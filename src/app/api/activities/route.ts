import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso, readDb, writeDb } from "@/lib/db";
import type { Activity } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const db = await readDb();
  const authed = await requireAuth();
  const list =
    all && authed ? db.activities : db.activities.filter((a) => a.published);
  return jsonOk(
    list.sort((a, b) => b.date.localeCompare(a.date)),
  );
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Activity>;
  if (!body.title || !body.date) return jsonError("Title and date are required");
  const db = await readDb();
  const activity: Activity = {
    id: newId(),
    title: body.title,
    description: body.description || "",
    date: body.date,
    category: body.category || "General",
    imageUrl: body.imageUrl || "",
    published: body.published ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.activities.push(activity);
  await writeDb(db);
  return jsonOk(activity, 201);
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<Activity> & { id: string };
  if (!body.id) return jsonError("id required");
  const db = await readDb();
  const idx = db.activities.findIndex((a) => a.id === body.id);
  if (idx < 0) return jsonError("Not found", 404);
  db.activities[idx] = {
    ...db.activities[idx],
    ...body,
    id: db.activities[idx].id,
    createdAt: db.activities[idx].createdAt,
    updatedAt: nowIso(),
  };
  await writeDb(db);
  return jsonOk(db.activities[idx]);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");
  const db = await readDb();
  db.activities = db.activities.filter((a) => a.id !== id);
  await writeDb(db);
  return jsonOk({ ok: true });
}
