import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId, nowIso } from "@/lib/db";
import { readWeeklyReports, writeWeeklyReports } from "@/lib/weeklyReports";
import type { WeeklyAttachment, WeeklyReport } from "@/lib/weeklyReportTypes";

function normalizeAttachments(raw: unknown): WeeklyAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === "object" && "url" in a)
    .map((a): WeeklyAttachment => {
      const x = a as WeeklyAttachment;
      return {
        url: String(x.url || ""),
        name: String(x.name || "file"),
        kind: x.kind === "document" ? ("document" as const) : ("image" as const),
      };
    })
    .filter((a) => a.url);
}

function fromBody(body: Partial<WeeklyReport>, existing?: WeeklyReport): WeeklyReport {
  const now = nowIso();
  return {
    id: existing?.id || newId(),
    email: body.email ?? existing?.email ?? "",
    weekStartDate: body.weekStartDate ?? existing?.weekStartDate ?? "",
    departmentLeadName:
      body.departmentLeadName ?? existing?.departmentLeadName ?? "",
    avgStudentsPresent:
      body.avgStudentsPresent ?? existing?.avgStudentsPresent ?? "",
    staffLeave: body.staffLeave ?? existing?.staffLeave ?? "",
    leisureClasses: body.leisureClasses ?? existing?.leisureClasses ?? "",
    schoolOpeningDays:
      body.schoolOpeningDays ?? existing?.schoolOpeningDays ?? "",
    mealsByDay: body.mealsByDay ?? existing?.mealsByDay ?? "",
    achievements: body.achievements ?? existing?.achievements ?? "",
    challenges: body.challenges ?? existing?.challenges ?? "",
    nextWeekPlan: body.nextWeekPlan ?? existing?.nextWeekPlan ?? "",
    requirementsSosd:
      body.requirementsSosd ?? existing?.requirementsSosd ?? "",
    expensesSosd: body.expensesSosd ?? existing?.expensesSosd ?? "",
    sanitationSosd: body.sanitationSosd ?? existing?.sanitationSosd ?? "",
    sanitationPinkyHouse:
      body.sanitationPinkyHouse ?? existing?.sanitationPinkyHouse ?? "",
    urgentRequirementsPinkyHouse:
      body.urgentRequirementsPinkyHouse ??
      existing?.urgentRequirementsPinkyHouse ??
      "",
    expensesPinkyHouse:
      body.expensesPinkyHouse ?? existing?.expensesPinkyHouse ?? "",
    requestsPinkyHouseStaff:
      body.requestsPinkyHouseStaff ?? existing?.requestsPinkyHouseStaff ?? "",
    complaintsParentsStaff:
      body.complaintsParentsStaff ?? existing?.complaintsParentsStaff ?? "",
    attachmentsSosd: normalizeAttachments(
      body.attachmentsSosd ?? existing?.attachmentsSosd,
    ),
    attachmentsPinkyHouse: normalizeAttachments(
      body.attachmentsPinkyHouse ?? existing?.attachmentsPinkyHouse,
    ),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export async function GET(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const db = await readWeeklyReports();
  if (id) {
    const row = db.reports.find((r) => r.id === id);
    if (!row) return jsonError("Not found", 404);
    return jsonOk(row);
  }
  const list = [...db.reports].sort((a, b) =>
    b.weekStartDate.localeCompare(a.weekStartDate),
  );
  return jsonOk(list);
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<WeeklyReport>;
  if (!body.weekStartDate) return jsonError("Week start date is required");
  if (!body.departmentLeadName?.trim()) {
    return jsonError("Department lead name is required");
  }
  const db = await readWeeklyReports();
  const report = fromBody(body);
  db.reports.push(report);
  await writeWeeklyReports(db);
  return jsonOk(report, 201);
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as Partial<WeeklyReport> & { id: string };
  if (!body.id) return jsonError("id required");
  const db = await readWeeklyReports();
  const idx = db.reports.findIndex((r) => r.id === body.id);
  if (idx < 0) return jsonError("Not found", 404);
  db.reports[idx] = fromBody(body, db.reports[idx]);
  await writeWeeklyReports(db);
  return jsonOk(db.reports[idx]);
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("id required");
  const db = await readWeeklyReports();
  db.reports = db.reports.filter((r) => r.id !== id);
  await writeWeeklyReports(db);
  return jsonOk({ ok: true });
}
