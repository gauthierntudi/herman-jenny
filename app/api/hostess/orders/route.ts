import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHostess } from "@/lib/staff-auth";
import { createDrinkOrderSchema, drinkOrderActionSchema } from "@/lib/validators";

const orderInclude = {
  table: true,
  items: { include: { drink: true } },
} as const;

function serializeOrder(order: {
  id: string;
  status: string;
  createdAt: Date;
  table: { id: string; name: string };
  items: { id: string; quantity: number; drink: { id: string; name: string; unit: string } }[];
}) {
  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    table: { id: order.table.id, name: order.table.name },
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      drink: { id: item.drink.id, name: item.drink.name, unit: item.drink.unit },
    })),
  };
}

export async function GET(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const open = searchParams.get("open") !== "0";

    const orders = await prisma.drinkOrder.findMany({
      where: open
        ? { status: { in: ["PENDING", "PREPARING", "READY"] } }
        : undefined,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    return NextResponse.json({
      success: true,
      orders: orders.map(serializeOrder),
      pendingCount: orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING").length,
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

    if (body.action) {
      const parsed = drinkOrderActionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, message: "Données invalides" }, { status: 400 });
      }

      const nextStatus = {
        prepare: "PREPARING",
        ready: "READY",
        pickup: "PICKED_UP",
        cancel: "CANCELLED",
      }[parsed.data.action] as "PREPARING" | "READY" | "PICKED_UP" | "CANCELLED";

      const order = await prisma.drinkOrder.update({
        where: { id: parsed.data.orderId },
        data: { status: nextStatus },
        include: orderInclude,
      });

      return NextResponse.json({ success: true, order: serializeOrder(order) });
    }

    const parsed = createDrinkOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Précisez au moins une boisson." }, { status: 400 });
    }

    const table = await prisma.weddingTable.findUnique({ where: { id: parsed.data.tableId } });
    if (!table) {
      return NextResponse.json({ success: false, message: "Table introuvable" }, { status: 404 });
    }

    const drinkIds = parsed.data.items.map((item) => item.drinkId);
    const drinks = await prisma.drinkItem.findMany({
      where: { id: { in: drinkIds }, active: true },
    });
    if (drinks.length !== drinkIds.length) {
      return NextResponse.json({ success: false, message: "Une boisson n’est plus disponible." }, { status: 400 });
    }

    const order = await prisma.drinkOrder.create({
      data: {
        tableId: parsed.data.tableId,
        items: {
          create: parsed.data.items.map((item) => ({
            drinkId: item.drinkId,
            quantity: item.quantity,
          })),
        },
      },
      include: orderInclude,
    });

    return NextResponse.json({ success: true, order: serializeOrder(order) });
  } catch {
    return NextResponse.json(
      { success: false, message: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}
