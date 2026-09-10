import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { readDb } from "@/lib/db";
import { readFinance } from "@/lib/finance";
import {
  buildProgressReport,
  defaultProgressYear,
  type ProgressYearMode,
} from "@/lib/progressReport";

/**
 * Auto-generate annual progress report from school, students, staff,
 * teachers, activities, programs, and finance (same period).
 *
 * Query: mode=nepal_fy|calendar, year=YYYY (FY start year for nepal_fy)
 */
export async function GET(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") || "nepal_fy") as ProgressYearMode;
  if (mode !== "nepal_fy" && mode !== "calendar") {
    return jsonError("mode must be nepal_fy or calendar");
  }

  const yearRaw = searchParams.get("year");
  const year = yearRaw
    ? Number(yearRaw)
    : defaultProgressYear(mode);

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return jsonError("Valid year is required");
  }

  const [db, finance] = await Promise.all([readDb(), readFinance()]);
  const report = buildProgressReport(db, mode, year, finance);
  return jsonOk(report);
}
