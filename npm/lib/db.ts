import { neon, neonConfig } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está configurado. Añádelo a tus variables de entorno.");
}

neonConfig.fetchConnectionCache = true;

export const sql = neon(process.env.DATABASE_URL);

export async function getConnectionStatus() {
  try {
    const response = await sql`SELECT 'online' AS status;`;
    return response[0]?.status ?? "unknown";
  } catch (error) {
    console.error("Error verificando la conexión a Neon", error);
    return "error";
  }
}
