import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { DATA_DIR, DATABASE_FILE } from "../lib/dataStore.js";
import { UPLOADS_DIR } from "../lib/upload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function safeCopyFile(source, destDir) {
  if (!source) return false;
  const exists = await fs.pathExists(source);
  if (!exists) return false;
  await fs.ensureDir(destDir);
  await fs.copy(source, path.join(destDir, path.basename(source)));
  return true;
}

async function safeCopyDir(source, dest) {
  if (!source) return false;
  const exists = await fs.pathExists(source);
  if (!exists) return false;
  await fs.copy(source, dest, { overwrite: true, errorOnExist: false });
  return true;
}

async function main() {
  const backupsRoot = path.resolve(__dirname, "../backups");
  const outDir = path.join(backupsRoot, stamp());

  await fs.ensureDir(outDir);

  const results = {
    outDir,
    dataDir: DATA_DIR,
    dbFile: DATABASE_FILE,
    uploadsDir: UPLOADS_DIR,
    copiedDb: false,
    copiedDataDir: false,
    copiedUploads: false,
  };

  results.copiedDb = await safeCopyFile(DATABASE_FILE, outDir);
  results.copiedDataDir = await safeCopyDir(DATA_DIR, path.join(outDir, "data"));
  results.copiedUploads = await safeCopyDir(UPLOADS_DIR, path.join(outDir, "uploads"));

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

