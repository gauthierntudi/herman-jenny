import { auth } from "@/auth";
import { createGuestRecord } from "@/lib/guest-create";
import { getPeopleCount, sumTableOccupied } from "@/lib/people-count";
import { prisma } from "@/lib/prisma";
import {
  assignGuestSchema,
  createGuestAndAssignSchema,
  createTableSchema,
  markInvitationSentSchema,
  markInvitationsSentSchema,
  tableIdSchema,
  unassignGuestSchema,
  updateTableSchema,
} from "@/lib/validators";
import { NextResponse } from "next/server";

const tableInclude = {
  assignments: {
    include: { guest: true },
    orderBy: { createdAt: "asc" as const },
  },
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

async function getTableOrError(id: string) {
  const table = await prisma.weddingTable.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { guest: true },
      },
    },
  });
  if (!table) return { error: "Table introuvable" };
  return { table };
}

async function assignGuestToTable(tableId: string, guestId: string) {
  const tableResult = await getTableOrError(tableId);
  if ("error" in tableResult) return { success: false, message: tableResult.error };

  const { table } = tableResult;
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) {
    return { success: false, message: "Invité introuvable" };
  }

  const occupied = sumTableOccupied(table.assignments);
  const adding = getPeopleCount(guest);
  if (occupied + adding > table.seatCount) {
    const remaining = Math.max(0, table.seatCount - occupied);
    return {
      success: false,
      message:
        remaining === 0
          ? "Cette table est complète"
          : `Il reste ${remaining} place(s), cet invité en nécessite ${adding}`,
    };
  }

  const existingAssignment = await prisma.tableAssignment.findUnique({ where: { guestId } });
  if (existingAssignment) {
    if (existingAssignment.tableId === tableId) {
      return { success: false, message: "Cet invité est déjà à cette table" };
    }
    return { success: false, message: "Cet invité est déjà assigné à une autre table" };
  }

  await prisma.tableAssignment.create({
    data: { tableId, guestId },
  });

  const updated = await prisma.weddingTable.findUnique({
    where: { id: tableId },
    include: tableInclude,
  });

  return { success: true, table: updated, guest };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const tables = await prisma.weddingTable.findMany({
    orderBy: { name: "asc" },
    include: tableInclude,
  });

  return NextResponse.json({ success: true, tables });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as string;

  try {
    if (action === "create_table") {
      const parsed = createTableSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" });
      }

      const table = await prisma.weddingTable.create({
        data: parsed.data,
        include: tableInclude,
      });

      return NextResponse.json({ success: true, table });
    }

    if (action === "update_table") {
      const parsed = updateTableSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" });
      }

      const { id, ...data } = parsed.data;
      const current = await prisma.weddingTable.findUnique({
        where: { id },
        include: {
          assignments: {
            include: { guest: true },
          },
        },
      });

      if (!current) {
        return NextResponse.json({ success: false, message: "Table introuvable" });
      }

      const occupied = sumTableOccupied(current.assignments);
      if (data.seatCount !== undefined && data.seatCount < occupied) {
        return NextResponse.json({
          success: false,
          message: `Impossible : ${occupied} place(s) déjà occupée(s)`,
        });
      }

      const table = await prisma.weddingTable.update({
        where: { id },
        data,
        include: tableInclude,
      });

      return NextResponse.json({ success: true, table });
    }

    if (action === "delete_table") {
      const parsed = tableIdSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "ID invalide" });
      }

      await prisma.weddingTable.delete({ where: { id: parsed.data.id } });
      return NextResponse.json({ success: true });
    }

    if (action === "assign_guest") {
      const parsed = assignGuestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" });
      }

      const result = await assignGuestToTable(parsed.data.tableId, parsed.data.guestId);
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message });
      }

      return NextResponse.json({
        success: true,
        table: result.table,
        guest: result.guest,
      });
    }

    if (action === "create_and_assign") {
      const parsed = createGuestAndAssignSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" });
      }

      const tableResult = await getTableOrError(parsed.data.tableId);
      if ("error" in tableResult) {
        return NextResponse.json({ success: false, message: tableResult.error });
      }

      const { table } = tableResult;
      const occupied = sumTableOccupied(table.assignments);
      if (occupied + 1 > table.seatCount) {
        return NextResponse.json({ success: false, message: "Cette table est complète" });
      }

      const guest = await createGuestRecord({
        name: parsed.data.name,
        phone: parsed.data.phone,
        genre: parsed.data.genre,
      });

      const assignResult = await assignGuestToTable(parsed.data.tableId, guest.id);
      if (!assignResult.success) {
        await prisma.guest.delete({ where: { id: guest.id } });
        return NextResponse.json({ success: false, message: assignResult.message });
      }

      return NextResponse.json({
        success: true,
        table: assignResult.table,
        guest: assignResult.guest,
      });
    }

    if (action === "unassign_guest") {
      const parsed = unassignGuestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" });
      }

      const assignment = await prisma.tableAssignment.findUnique({
        where: { guestId: parsed.data.guestId },
      });

      if (!assignment) {
        return NextResponse.json({ success: false, message: "Assignation introuvable" });
      }

      await prisma.tableAssignment.delete({ where: { guestId: parsed.data.guestId } });

      const table = await prisma.weddingTable.findUnique({
        where: { id: assignment.tableId },
        include: tableInclude,
      });

      return NextResponse.json({ success: true, table });
    }

    if (action === "mark_invitation_sent") {
      const parsed = markInvitationSentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" });
      }

      const assignment = await prisma.tableAssignment.findUnique({
        where: { guestId: parsed.data.guestId },
      });

      if (!assignment) {
        return NextResponse.json({ success: false, message: "Assignation introuvable" });
      }

      await prisma.tableAssignment.update({
        where: { guestId: parsed.data.guestId },
        data: { invitationSent: true },
      });

      const table = await prisma.weddingTable.findUnique({
        where: { id: assignment.tableId },
        include: tableInclude,
      });

      return NextResponse.json({ success: true, table });
    }

    if (action === "mark_invitations_sent") {
      const parsed = markInvitationsSentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" });
      }

      await prisma.tableAssignment.updateMany({
        where: { guestId: { in: parsed.data.guestIds } },
        data: { invitationSent: true },
      });

      const tables = await prisma.weddingTable.findMany({
        orderBy: { name: "asc" },
        include: tableInclude,
      });

      return NextResponse.json({ success: true, tables });
    }

    return NextResponse.json({ success: false, message: "Action inconnue" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, message });
  }
}
