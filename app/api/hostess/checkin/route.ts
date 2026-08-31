import { NextResponse } from "next/server";
import { guestTableInclude, serializeHostessGuest } from "@/lib/hostess";
import { prisma } from "@/lib/prisma";
import { getPeopleCount } from "@/lib/people-count";
import { requireHostess } from "@/lib/staff-auth";
import { hostessCheckinSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = hostessCheckinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Données invalides" }, { status: 400 });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: parsed.data.guestId },
      include: guestTableInclude,
    });

    if (!guest) {
      return NextResponse.json({ success: false, message: "Invité introuvable" }, { status: 404 });
    }

    if (parsed.data.action === "undo") {
      const updated = await prisma.guest.update({
        where: { id: guest.id },
        data: { checkedInAt: null, checkedInCount: null },
        include: guestTableInclude,
      });

      await prisma.usherCall.updateMany({
        where: { guestId: guest.id, status: { in: ["WAITING", "TAKEN"] } },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        success: true,
        guest: serializeHostessGuest(updated),
      });
    }

    const peopleCount = parsed.data.peopleCount ?? getPeopleCount(guest);
    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        checkedInAt: guest.checkedInAt ?? new Date(),
        checkedInCount: peopleCount,
      },
      include: guestTableInclude,
    });

    if (!guest.checkedInAt) {
      const waiting = await prisma.usherCall.findFirst({
        where: { guestId: guest.id, status: "WAITING" },
      });
      if (!waiting) {
        await prisma.usherCall.create({
          data: {
            guestId: guest.id,
            tableId: guest.tableAssignment?.tableId ?? null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: !!guest.checkedInAt,
      guest: serializeHostessGuest(updated),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}
