import { NextResponse } from "next/server";
import { ensureDrinkCatalog } from "@/lib/drink-catalog";
import { slugifyDrink } from "@/lib/slugify-drink";
import { prisma } from "@/lib/prisma";
import { requireHostess } from "@/lib/staff-auth";
import { createDrinkItemSchema, hostessDrinkSchema, updateDrinkItemSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  await ensureDrinkCatalog();
  const drinks = await prisma.drinkItem.findMany({
    where: all ? undefined : { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    success: true,
    drinks: drinks.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      unit: d.unit,
      active: d.active,
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

    if (body.action === "create") {
      const parsed = createDrinkItemSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Nom de boisson invalide" }, { status: 400 });
      }

      const maxOrder = await prisma.drinkItem.aggregate({ _max: { sortOrder: true } });
      let slug = slugifyDrink(parsed.data.name);
      const taken = await prisma.drinkItem.findUnique({ where: { slug } });
      if (taken) slug = `${slug}-${Date.now().toString(36)}`;

      const drink = await prisma.drinkItem.create({
        data: {
          name: parsed.data.name,
          unit: parsed.data.unit || "verre",
          slug,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });

      return NextResponse.json({ success: true, drink });
    }

    if (body.action === "update") {
      const parsed = updateDrinkItemSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" }, { status: 400 });
      }

      const drink = await prisma.drinkItem.update({
        where: { id: parsed.data.id },
        data: {
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
          ...(parsed.data.unit ? { unit: parsed.data.unit } : {}),
          ...(typeof parsed.data.active === "boolean" ? { active: parsed.data.active } : {}),
        },
      });

      return NextResponse.json({ success: true, drink });
    }

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
