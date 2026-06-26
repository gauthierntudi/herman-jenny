import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/prisma";
import { GuestStatus } from "@prisma/client";

type LegacyGuest = {
  phone?: string;
  name?: string;
  genre?: string;
  token?: string;
  device_id?: string | null;
  status?: string;
  status_send?: boolean | null;
  send_blocked?: boolean | null;
  availability?: boolean | null;
  outside_usa?: boolean;
  people_count?: number;
  need_invitation?: boolean;
  need_visa_assistance?: boolean;
  need_hotel_booking?: boolean;
};

function guestData(g: LegacyGuest, token: string, deviceId: string | null) {
  return {
    name: g.name!,
    genre: g.genre || "Cher",
    token,
    deviceId,
    status: g.status === "active" ? GuestStatus.ACTIVE : GuestStatus.PENDING,
    statusSend: g.status_send === true,
    sendBlocked: g.send_blocked === true,
    availability: g.availability ?? null,
    outsideUsa: g.outside_usa ?? null,
    peopleCount: g.people_count ?? null,
    needInvitation: !!g.need_invitation,
    needVisaAssistance: !!g.need_visa_assistance,
    needHotelBooking: !!g.need_hotel_booking,
  };
}

async function main() {
  const guestsPath = join(process.cwd(), "guests.json");
  if (!existsSync(guestsPath)) {
    console.log("No guests.json found, skipping seed.");
    return;
  }

  const raw = readFileSync(guestsPath, "utf-8");
  const guests = JSON.parse(raw) as LegacyGuest[];

  if (!Array.isArray(guests)) {
    throw new Error("guests.json must be an array");
  }

  const usedDeviceIds = new Set<string>();
  let imported = 0;
  let skippedDeviceId = 0;
  let skippedInvalid = 0;

  for (const g of guests) {
    if (!g.phone || !g.name) {
      skippedInvalid++;
      continue;
    }

    const token = g.token ? String(g.token) : String(Math.floor(100000 + Math.random() * 900000));

    let deviceId: string | null = g.device_id?.trim() || null;
    if (deviceId) {
      if (usedDeviceIds.has(deviceId)) {
        deviceId = null;
        skippedDeviceId++;
      } else {
        const taken = await prisma.guest.findFirst({
          where: { deviceId, NOT: { phone: g.phone } },
          select: { phone: true, name: true },
        });
        if (taken) {
          deviceId = null;
          skippedDeviceId++;
        } else {
          usedDeviceIds.add(deviceId);
        }
      }
    }

    const data = guestData(g, token, deviceId);

    await prisma.guest.upsert({
      where: { phone: g.phone },
      create: { phone: g.phone, ...data },
      update: data,
    });

    imported++;
  }

  const total = await prisma.guest.count();
  console.log(`Import terminé : ${imported} invité(s) depuis guests.json (${guests.length} entrées).`);
  console.log(`Total en base : ${total}`);
  if (skippedDeviceId) {
    console.log(`⚠ ${skippedDeviceId} device_id en doublon ignoré(s) (conflit JSON ou base).`);
  }
  if (skippedInvalid) {
    console.log(`⚠ ${skippedInvalid} entrée(s) ignorée(s) (phone ou name manquant).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
