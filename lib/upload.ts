import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function saveUpload(file: File) {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return { storedName, filePath };
}

/** Best-effort delete — a missing file (already gone, or never on disk) is not an error. */
export async function deleteUpload(filePath: string | null | undefined) {
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code !== "ENOENT") throw e;
  }
}
