import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

export async function generateUniqueToken(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const token = String(randomInt(100000, 999999));
    const existing = await prisma.guest.findUnique({ where: { token }, select: { id: true } });
    if (!existing) return token;
  }
  throw new Error("Unable to generate unique token");
}

type CreateGuestInput = {
  name: string;
  phone: string;
  genre?: string;
};

export async function createGuestRecord(input: CreateGuestInput) {
  const phone = normalizePhone(input.phone.trim());
  const name = input.name.trim();

  if (!phone || phone.length < 8) {
    throw new Error("Numéro de téléphone invalide");
  }
  if (name.length < 2) {
    throw new Error("Nom invalide");
  }

  const existing = await prisma.guest.findUnique({ where: { phone } });
  if (existing) {
    throw new Error("Un invité avec ce numéro existe déjà");
  }

  const token = await generateUniqueToken();

  return prisma.guest.create({
    data: {
      phone,
      name,
      genre: input.genre?.trim() || "Cher",
      token,
    },
  });
}
