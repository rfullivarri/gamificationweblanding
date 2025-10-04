import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(projectRoot, "node_modules", ".cache");
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 200;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryRemove(targetPath) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await fs.rm(targetPath, {
        recursive: true,
        force: true,
        maxRetries: MAX_RETRIES,
        retryDelay: RETRY_DELAY_MS,
      });
      if (attempt > 1) {
        console.log(
          `preinstall: eliminado ${path.relative(projectRoot, targetPath)} tras ${attempt} intentos.`,
        );
      }
      return true;
    } catch (error) {
      if ((error.code !== "EBUSY" && error.code !== "EPERM") || attempt === MAX_RETRIES) {
        return false;
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  return false;
}

async function removeCacheDir() {
  try {
    await fs.access(cacheDir);
  } catch {
    return;
  }

  if (await tryRemove(cacheDir)) {
    return;
  }

  const tempDir = `${cacheDir}-cleanup-${Date.now()}`;

  try {
    await fs.rename(cacheDir, tempDir);
  } catch (error) {
    console.warn("preinstall: no se pudo renombrar node_modules/.cache", error);
    return;
  }

  if (await tryRemove(tempDir)) {
    console.warn(
      "preinstall: node_modules/.cache se liberó tras renombrarlo temporalmente.",
    );
    return;
  }

  console.warn(
    "preinstall: no se pudo limpiar node_modules/.cache tras múltiples intentos.",
  );
}

await removeCacheDir();
