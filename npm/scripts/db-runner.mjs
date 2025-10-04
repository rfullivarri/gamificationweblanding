import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readSql(relPath) {
  const full = path.resolve(__dirname, "..", relPath);
  return fs.readFileSync(full, "utf8");
}

async function runSql(label, sql) {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    throw new Error("DATABASE_URL no definido. Setealo antes de correr el script.");
  }
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }, // Railway exige SSL
  });
  await client.connect();
  try {
    console.log(`\n=== Ejecutando ${label} ===`);
    await client.query(sql);
    console.log(`✔ OK: ${label}`);
  } finally {
    await client.end();
  }
}

const cmd = process.argv[2]; // "schema" | "seeds" | "all"
if (!cmd) {
  console.error("Uso: node scripts/db-runner.mjs <schema|seeds|all>");
  process.exit(1);
}

try {
  if (cmd === "schema" || cmd === "all") {
    const ddl = readSql("../db/sql/schema.sql");
    await runSql("schema.sql", ddl);
  }
  if (cmd === "seeds" || cmd === "all") {
    const seeds = readSql("../db/sql/seeds.sql");
    await runSql("seeds.sql", seeds);
  }
  console.log("\nTodo listo ✅");
} catch (err) {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
}
