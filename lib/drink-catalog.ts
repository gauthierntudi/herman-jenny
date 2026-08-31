import { prisma } from "@/lib/prisma";

export const DEFAULT_DRINKS = [
  { slug: "champagne", name: "Champagne", unit: "flute", sortOrder: 1 },
  { slug: "vin-rouge", name: "Vin rouge", unit: "verre", sortOrder: 2 },
  { slug: "vin-blanc", name: "Vin blanc", unit: "verre", sortOrder: 3 },
  { slug: "eau", name: "Eau", unit: "verre", sortOrder: 4 },
  { slug: "soft", name: "Soft", unit: "verre", sortOrder: 5 },
  { slug: "biere", name: "Bière", unit: "bouteille", sortOrder: 6 },
] as const;

export async function ensureDrinkCatalog() {
  const count = await prisma.drinkItem.count();
  if (count > 0) {
    return prisma.drinkItem.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  await prisma.drinkItem.createMany({
    data: DEFAULT_DRINKS.map((d) => ({ ...d })),
    skipDuplicates: true,
  });

  return prisma.drinkItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}
