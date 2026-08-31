import { NextResponse } from "next/server";
import { ensureDrinkCatalog } from "@/lib/drink-catalog";
import { prisma } from "@/lib/prisma";
import { requireHostess } from "@/lib/staff-auth";
import { hostessDrinkSchema } from "@/lib/validators";

export async function GET() {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const drinks = await ensureDrinkCatalog();
  return NextResponse.json({
    success: true,
    drinks: drinks.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      unit: d.unit,
    })),
  });
}

export async function POST(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = hostessDrinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Données invalides" }, { status: 400 });
    }

    const { action, tableId, drinkId } = parsed.data;

    const [table, drink] = await Promise.all([
      prisma.weddingTable.findUnique({ where: { id: tableId } }),
      prisma.drinkItem.findUnique({ where: { id: drinkId } }),
    ]);

    if (!table) {
      return NextResponse.json({ success: false, message: "Table introuvable" }, { status: 404 });
    }
    if (!drink || !drink.active) {
      return NextResponse.json({ success: false, message: "Boisson introuvable" }, { status: 404 });
    }

    if (action === "undo") {
      const last = await prisma.drinkServing.findFirst({
        where: { tableId, drinkId },
        orderBy: { createdAt: "desc" },
      });
      if (!last) {
        return NextResponse.json({
          success: true,
          quantity: 0,
          tableId,
          drinkId,
        });
      }
      await prisma.drinkServing.delete({ where: { id: last.id } });
    } else {
      await prisma.drinkServing.create({
        data: { tableId, drinkId, quantity: 1 },
      });
    }

    const aggregate = await prisma.drinkServing.aggregate({
      where: { tableId, drinkId },
      _sum: { quantity: true },
    });

    return NextResponse.json({
      success: true,
      tableId,
      drinkId,
      quantity: aggregate._sum.quantity ?? 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}
