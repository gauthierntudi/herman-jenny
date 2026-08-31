import { NextResponse } from "next/server";
import { serializeHostessGuest } from "@/lib/hostess";
import { prisma } from "@/lib/prisma";
import { requireHostess } from "@/lib/staff-auth";
import { usherCallActionSchema } from "@/lib/validators";

const callInclude = {
  guest: { include: { tableAssignment: { include: { table: true } } } },
  table: true,
} as const;

function serializeCall(call: {
  id: string;
  status: string;
  createdAt: Date;
  table: { id: string; name: string } | null;
  guest: Parameters<typeof serializeHostessGuest>[0];
}) {
  return {
    id: call.id,
    status: call.status,
    createdAt: call.createdAt.toISOString(),
    table: call.table ? { id: call.table.id, name: call.table.name } : null,
    guest: serializeHostessGuest(call.guest),
  };
}

export async function GET() {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const calls = await prisma.usherCall.findMany({
      where: { status: { in: ["WAITING", "TAKEN"] } },
      include: callInclude,
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      calls: calls.map(serializeCall),
      waitingCount: calls.filter((c) => c.status === "WAITING").length,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = usherCallActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Données invalides" }, { status: 400 });
    }

    const nextStatus = {
      take: "TAKEN",
      seat: "SEATED",
      cancel: "CANCELLED",
    }[parsed.data.action] as "TAKEN" | "SEATED" | "CANCELLED";

    const call = await prisma.usherCall.update({
      where: { id: parsed.data.callId },
      data: { status: nextStatus },
      include: callInclude,
    });

    return NextResponse.json({ success: true, call: serializeCall(call) });
  } catch {
    return NextResponse.json(
      { success: false, message: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}
