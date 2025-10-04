import { auth } from "@clerk/nextjs";

export function requireAuth() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Acceso no autorizado");
  }

  return userId;
}
