import { NextRequest, NextResponse } from "next/server";
import { FROM, resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  if (!FROM) {
    return NextResponse.json(
      { error: "Configura RESEND_FROM en las variables de entorno." },
      { status: 400 },
    );
  }

  try {
    const body = await getBodySafe(req);
    const toCandidates = [
      body?.to,
      process.env.TEST_EMAIL,
      // Mantener FROM al final como último recurso (para no romper flujos previos)
      FROM,
    ].filter(Boolean);

    if (!toCandidates.length) {
      return NextResponse.json(
        { error: "Falta destinatario: envía { to } en el body o setea TEST_EMAIL." },
        { status: 400 },
      );
    }

    // Acepta string o array; normaliza a array de strings
    const to = Array.isArray(toCandidates[0])
      ? (toCandidates[0] as string[])
      : [String(toCandidates[0])];

    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Prueba de Resend desde MiProveedor",
      html: "<p>Si ves este correo, Resend está funcionando 🚀</p>",
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, to });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function getBodySafe(
  req: NextRequest,
): Promise<{ to?: string | string[] } | null> {
  try {
    return (await req.json()) as { to?: string | string[] };
  } catch {
    return null;
  }
}
