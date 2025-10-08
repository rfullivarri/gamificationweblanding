import { NextResponse } from "next/server";

import { SummaryInputError, getUserSummaryToday } from "@/routes/users";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get("userId") ?? undefined;
  const clerkUserId = searchParams.get("clerkId") ?? undefined;
  const email = searchParams.get("email") ?? undefined;
  const date = searchParams.get("date") ?? undefined;

  try {
    const summary = await getUserSummaryToday({ userId, clerkUserId, email, date });

    if (!summary) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof SummaryInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Error obteniendo el resumen diario del usuario", error);
    return NextResponse.json(
      { error: "No se pudo generar el resumen diario" },
      { status: 500 }
    );
  }
}
