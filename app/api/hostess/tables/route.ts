import { NextResponse } from "next/server";
import { ensureDrinkCatalog } from "@/lib/drink-catalog";
import { serializeHostessGuest } from "@/lib/hostess";
import { getPeopleCount, sumTableOccupied } from "@/lib/people-count";
import { prisma } from "@/lib/prisma";
import { requireHostess } from "@/lib/staff-auth";

export async function GET() {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const [drinks, tables, drinkTotals] = await Promise.all([
      ensureDrinkCatalog(),
      prisma.weddingTable.findMany({
        orderBy: { name: "asc" },
        include: {
          assignments: {
            include: { guest: true },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.drinkServing.groupBy({
        by: ["tableId", "drinkId"],
        _sum: { quantity: true },
      }),
    ]);

    const totalsMap = new Map<string, number>();
    for (const row of drinkTotals) {
      totalsMap.set(`${row.tableId}:${row.drinkId}`, row._sum.quantity ?? 0);
    }

    const payload = tables.map((table) => {
      const guests = table.assignments.map((a) => serializeHostessGuest({ ...a.guest, tableAssignment: { table } }));
      const expected = sumTableOccupied(table.assignments);
      const arrived = table.assignments.reduce((sum, a) => {
        if (!a.guest.checkedInAt) return sum;
        return sum + (a.guest.checkedInCount ?? getPeopleCount(a.guest));
      }, 0);

      const drinkCounts: Record<string, number> = {};
      for (const drink of drinks) {
        drinkCounts[drink.id] = totalsMap.get(`${table.id}:${drink.id}`) ?? 0;
      }

      return {
        id: table.id,
        name: table.name,
        seatCount: table.seatCount,
        expected,
        arrived,
        guests,
        drinks: drinkCounts,
      };
    });

    const checkedInGuests = await prisma.guest.count({
      where: { checkedInAt: { not: null } },
    });
    const checkedInPeople = await prisma.guest.findMany({
      where: { checkedInAt: { not: null } },
      select: { peopleCount: true, checkedInCount: true },
    });
    const arrivedPeople = checkedInPeople.reduce(
      (sum, g) => sum + (g.checkedInCount ?? g.peopleCount ?? 1),
      0
    );

    return NextResponse.json({
      success: true,
      drinks: drinks.map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        unit: d.unit,
      })),
      tables: payload,
      stats: {
        tables: tables.length,
        checkedInGuests,
        arrivedPeople,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}
