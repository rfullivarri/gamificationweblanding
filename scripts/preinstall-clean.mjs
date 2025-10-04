import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(projectRoot, "node_modules", ".cache");
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 200;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeCacheDir() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await fs.rm(cacheDir, { recursive: true, force: true });
      if (attempt > 1) {
        console.log(`preinstall: eliminado .cache tras ${attempt} intentos.`);
      }
      return;
    } catch (error) {
      if (error.code !== "EBUSY" || attempt === MAX_RETRIES) {
        console.warn("preinstall: no se pudo limpiar node_modules/.cache", error);
        return;
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}

await removeCacheDir();
