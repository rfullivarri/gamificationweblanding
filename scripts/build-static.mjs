import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

const entries = [
  "indexv2.html",
  "index-bbdd.html",
  "formsintrov3.html",
  "signupv2.html",
  "loginv2.html",
  "dashboardv3.html",
  "offline.html",
  "manifest.json",
  "sw.js",
  { src: "css", dest: "css" },
  { src: "js", dest: "js" },
  { src: "icons", dest: "icons" }
];

function prepareDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function copyEntry(entry) {
  const src = typeof entry === "string" ? entry : entry.src;
  const dest = typeof entry === "string" ? entry : entry.dest;

  const srcPath = path.join(projectRoot, src);
  const destPath = path.join(distDir, dest);

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  Recurso no encontrado, se omite: ${src}`);
    return;
  }

  const stats = fs.statSync(srcPath);
  if (stats.isDirectory()) {
    fs.mkdirSync(destPath, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
  }

  fs.cpSync(srcPath, destPath, { recursive: true });
  console.log(`✅ Copiado ${src} → ${dest}`);
}

function writeReadme() {
  const readmePath = path.join(distDir, "README.txt");
  const content = `Build estático generado el ${new Date().toISOString()}\n\n` +
    "Contenido copiado desde la raíz del proyecto para desplegar en entornos sin Node.js.";
  fs.writeFileSync(readmePath, content);
}

function main() {
  prepareDist();
  entries.forEach(copyEntry);
  writeReadme();
  console.log("\n📦 Build estático listo en dist/\n");
}

main();
