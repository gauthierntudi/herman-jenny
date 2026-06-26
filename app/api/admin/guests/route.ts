import { auth } from "@/auth";
import { getPeopleCount, sumTableOccupied } from "@/lib/people-count";
import { prisma } from "@/lib/prisma";
import { isValidE164, normalizePhone } from "@/lib/phone";
import { markSentSchema, updateGuestSchema, updatePeopleCountSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json(guests);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as string;

  if (action === "mark_sent") {
    const parsed = markSentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Requête invalide" });
    }

    if (parsed.data.all) {
      const result = await prisma.guest.updateMany({
        where: { statusSend: false },
        data: { statusSend: true },
      });
      return NextResponse.json({ success: true, updated: result.count });
    }

    const phones = (parsed.data.phones ?? []).map(normalizePhone).filter(Boolean);
    if (!phones.length) {
      return NextResponse.json({ success: false, message: "Aucun invité sélectionné" });
    }

    const result = await prisma.guest.updateMany({
      where: { phone: { in: phones } },
      data: { statusSend: true },
    });

    return NextResponse.json({ success: true, updated: result.count });
  }

  if (action === "update_people_count") {
    const parsed = updatePeopleCountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Requête invalide" });
    }

    const assignment = await prisma.tableAssignment.findUnique({
      where: { guestId: parsed.data.guestId },
      include: {
        table: {
          include: {
            assignments: {
              include: { guest: true },
            },
          },
        },
      },
    });

    const effectiveCount = parsed.data.peopleCount;

    if (assignment) {
      const others = assignment.table.assignments.filter((a) => a.guestId !== parsed.data.guestId);
      const occupiedOthers = sumTableOccupied(others);
      if (occupiedOthers + effectiveCount > assignment.table.seatCount) {
        const remaining = Math.max(0, assignment.table.seatCount - occupiedOthers);
        return NextResponse.json({
          success: false,
          message: `Il reste ${remaining} place(s) à cette table pour cet invité`,
        });
      }
    }

    const guest = await prisma.guest.update({
      where: { id: parsed.data.guestId },
      data: { peopleCount: parsed.data.peopleCount },
    });

    return NextResponse.json({ success: true, guest });
  }

  if (action === "update_guest" || action === "update_name") {
    const parsed = updateGuestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Données invalides" });
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!isValidE164(phone)) {
      return NextResponse.json({ success: false, message: "Numéro invalide (format E.164 requis)" });
    }

    const duplicate = await prisma.guest.findUnique({ where: { phone } });
    if (duplicate && duplicate.id !== parsed.data.guestId) {
      return NextResponse.json({ success: false, message: "Ce numéro est déjà utilisé" });
    }

    const guest = await prisma.guest.update({
      where: { id: parsed.data.guestId },
      data: {
        name: parsed.data.name,
        phone,
        ...(parsed.data.genre !== undefined ? { genre: parsed.data.genre } : {}),
      },
    });

    return NextResponse.json({ success: true, guest });
  }

  return NextResponse.json({ success: false, message: "Action inconnue" });
}
