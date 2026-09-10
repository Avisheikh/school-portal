import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import {
  applyImport,
  buildTemplateWorkbook,
  previewImport,
  type ImportPreviewRow,
} from "@/lib/financeImport";
import { readFinance, writeFinance } from "@/lib/finance";

export async function GET() {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);
  const buf = buildTemplateWorkbook();
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="sosd-income-expense-template.xlsx"',
    },
  });
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);

  const contentType = request.headers.get("content-type") || "";

  // Confirm import with previewed rows (JSON)
  if (contentType.includes("application/json")) {
    const body = await request.json();
    if (body.action !== "confirm") {
      return jsonError("Unknown action");
    }
    const rows = (body.rows || []) as ImportPreviewRow[];
    const createMissingHeads = body.createMissingHeads !== false;
    if (!rows.length) return jsonError("No rows to import");

    const db = await readFinance();
    const result = applyImport(rows, db, { createMissingHeads });
    await writeFinance(result.db);

    return jsonOk({
      imported: result.imported,
      createdHeads: result.createdHeads,
      totalEntries: result.db.entries.length,
    });
  }

  // Upload file for preview
  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("Upload an Excel (.xlsx) or CSV file");
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
    return jsonError("Only .xlsx, .xls or .csv allowed");
  }
  if (file.size > 8 * 1024 * 1024) {
    return jsonError("File must be under 8MB");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const db = await readFinance();
    const preview = previewImport(buffer, db);
    return jsonOk({
      fileName: file.name,
      ...preview,
      sampleHeads: db.categories
        .filter((c) => c.active)
        .map((c) => `${c.name} (${c.type})`),
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Could not read Excel file",
    );
  }
}
