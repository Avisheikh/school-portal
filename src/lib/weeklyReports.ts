import { promises as fs } from "fs";
import path from "path";
import type { WeeklyReportsDatabase } from "./weeklyReportTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const PATH = path.join(DATA_DIR, "weekly-reports.json");

const empty: WeeklyReportsDatabase = { reports: [] };

async function ensure(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PATH);
  } catch {
    await fs.writeFile(PATH, JSON.stringify(empty, null, 2), "utf-8");
  }
}

export async function readWeeklyReports(): Promise<WeeklyReportsDatabase> {
  await ensure();
  const raw = await fs.readFile(PATH, "utf-8");
  const data = JSON.parse(raw) as WeeklyReportsDatabase;
  if (!Array.isArray(data.reports)) data.reports = [];
  return data;
}

export async function writeWeeklyReports(
  db: WeeklyReportsDatabase,
): Promise<void> {
  await ensure();
  await fs.writeFile(PATH, JSON.stringify(db, null, 2), "utf-8");
}

export {
  formatWeeklyReportText,
  mondayOfWeek,
  weekEndFromStart,
} from "./weeklyReportFormat";
