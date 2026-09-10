import { promises as fs } from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { newId } from "@/lib/db";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: Request) {
  if (!(await requireAuth())) return jsonError("Unauthorized", 401);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("No file uploaded");
  }

  const allowed = [...IMAGE_TYPES, ...DOC_TYPES];
  if (!allowed.includes(file.type)) {
    return jsonError("Only images (JPG/PNG/WEBP/GIF) or PDF/DOC/DOCX allowed");
  }
  if (file.size > 10 * 1024 * 1024) {
    return jsonError("File must be under 10MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const name = `${newId()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, name), buffer);

  const kind = IMAGE_TYPES.includes(file.type) ? "image" : "document";
  return jsonOk({
    url: `/uploads/${name}`,
    name: file.name,
    kind,
  });
}
