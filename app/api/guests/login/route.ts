import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getDeviceId,
  getOrCreateDeviceId,
  getStdAuthPhone,
  setStdAuthPhone,
} from "@/lib/guest-cookies";
import { isValidE164, normalizePhone } from "@/lib/phone";
import { guestLoginSchema } from "@/lib/validators";
import { GuestStatus } from "@prisma/client";
import { randomInt } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = guestLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Please enter your name." },
        { status: 400 }
      );
    }

    const userPhone = normalizePhone(parsed.data.full_phone);
    const guestName = parsed.data.guest_name;
    const urlToken = parsed.data.url_token?.trim() || "";

    if (!isValidE164(userPhone)) {
      return NextResponse.json(
        { success: false, message: "Invalid number. Please check the format." },
        { status: 400 }
      );
    }

    const deviceId = await getOrCreateDeviceId();

    let guest = await prisma.guest.findUnique({ where: { phone: userPhone } });

    if (guest) {
      if (guest.deviceId && guest.deviceId !== deviceId) {
        return NextResponse.json({
          success: false,
          message: "This WhatsApp number is already used by someone else.",
        });
      }

      if (urlToken && guest.token !== urlToken) {
        return NextResponse.json({
          success: false,
          message: "This link does not match your number. Please use your personal link.",
        });
      }

      guest = await prisma.guest.update({
        where: { phone: userPhone },
        data: {
          deviceId,
          status: GuestStatus.ACTIVE,
          name: guestName,
          ...(urlToken ? { token: urlToken } : {}),
        },
      });
    } else {
      guest = await prisma.guest.create({
        data: {
          phone: userPhone,
          name: guestName,
          genre: "Cher",
          token: urlToken || String(randomInt(100000, 999999)),
          deviceId,
          status: GuestStatus.ACTIVE,
        },
      });
    }

    await setStdAuthPhone(userPhone);

    const alreadySubmitted = guest.availability !== null;

    return NextResponse.json({
      success: true,
      alreadySubmitted,
      savedDates: [],
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const deviceId = await getDeviceId();
  const authPhone = await getStdAuthPhone();

  if (!deviceId || !authPhone) {
    return NextResponse.json({ authenticated: false });
  }

  const guest = await prisma.guest.findFirst({
    where: {
      phone: normalizePhone(authPhone),
      deviceId,
    },
  });

  if (!guest) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    alreadySubmitted: guest.availability !== null,
    name: guest.name,
  });
}
