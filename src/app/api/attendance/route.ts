import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso, readDb, writeDb } from "@/lib/db";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const db = await readDb();
  const records = date
    ? db.attendance.filter((a) => a.date === date)
    : db.attendance;
  return jsonOk(records);
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = await request.json();

  // Bulk mark for a date
  if (Array.isArray(body.records)) {
    const date = body.date as string;
    if (!date) return jsonError("date required");
    const db = await readDb();
    db.attendance = db.attendance.filter((a) => a.date !== date);
    const created: AttendanceRecord[] = body.records.map(
      (r: {
        personType: "staff" | "teacher";
        personId: string;
        personName: string;
        status: AttendanceStatus;
        notes?: string;
      }) => ({
        id: newId(),
        personType: r.personType,
        personId: r.personId,
        personName: r.personName,
        date,
        status: r.status || "present",
        notes: r.notes || "",
        markedAt: nowIso(),
      }),
    );
    db.attendance.push(...created);
    await writeDb(db);
    return jsonOk(created, 201);
  }

  const { personType, personId, personName, date, status, notes } = body;
  if (!personType || !personId || !date) {
    return jsonError("personType, personId and date are required");
  }
  const db = await readDb();
  const existing = db.attendance.findIndex(
    (a) =>
      a.date === date && a.personId === personId && a.personType === personType,
  );
  const record: AttendanceRecord = {
    id: existing >= 0 ? db.attendance[existing].id : newId(),
    personType,
    personId,
    personName: personName || "",
    date,
    status: status || "present",
    notes: notes || "",
    markedAt: nowIso(),
  };
  if (existing >= 0) db.attendance[existing] = record;
  else db.attendance.push(record);
  await writeDb(db);
  return jsonOk(record, existing >= 0 ? 200 : 201);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");
  const db = await readDb();
  db.attendance = db.attendance.filter((a) => a.id !== id);
  await writeDb(db);
  return jsonOk({ ok: true });
}
