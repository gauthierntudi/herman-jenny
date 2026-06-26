import { NextResponse } from "next/server";
import { generateInvitationPdf } from "@/lib/invitation-pdf";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

function parseToken(raw: string): string {
  return raw.replace(/\.pdf$/i, "").trim();
}

/** Token réservé — PDF générique pour validation Meta/Twilio (échantillon template). */
const SAMPLE_TOKEN = "sample";
const SAMPLE_GUEST_NAME = "Jean Dupont";

export async function GET(_request: Request, { params }: Params) {
  const token = parseToken((await params).token);

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  if (token === SAMPLE_TOKEN) {
    const pdfBytes = await generateInvitationPdf({
      guestName: SAMPLE_GUEST_NAME,
      token: SAMPLE_TOKEN,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="invitation-sample.pdf"',
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { tableAssignment: { include: { table: true } } },
  });

  if (!guest?.tableAssignment?.table) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  const pdfBytes = await generateInvitationPdf({
    guestName: guest.name,
    token: guest.token,
  });

  const filename = `invitation-${guest.token}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
