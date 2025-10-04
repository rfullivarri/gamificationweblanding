import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
let ClientCtor;

async function resolveClientCtor() {
  if (ClientCtor) return ClientCtor;

  let pgModule;
  try {
    pgModule = await import("pg");
  } catch (error) {
    const message =
      "Dependencia opcional `pg` no encontrada. Instala `pg` antes de ejecutar los scripts de base de datos (ej. `npm install pg`).";
    const err = new Error(message);
    err.cause = error;
    throw err;
  }

  const candidate = pgModule.Client ?? pgModule.default?.Client ?? pgModule.default;
  if (typeof candidate !== "function") {
    throw new Error("El paquete `pg` no expone la clase Client esperada.");
  }

  ClientCtor = candidate;
  return ClientCtor;
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readSql(relPath) {
  const full = path.resolve(__dirname, "..", relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Archivo SQL no encontrado: ${full}`);
  }
  return fs.readFileSync(full, "utf8");
}

async function runSql(label, sql) {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) throw new Error("DATABASE_URL no definido");
  const Client = await resolveClientCtor();
  const sslRequired = process.env.DB_SSL === "false" || process.env.DB_SSL === "0" ? false : { rejectUnauthorized: false };
  const client = new Client({
    connectionString: connStr,
    ssl: sslRequired
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

(async () => {
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
})();
