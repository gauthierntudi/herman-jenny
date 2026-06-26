import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeviceId } from "@/lib/guest-cookies";

export async function POST() {
  const deviceId = await getDeviceId();

  if (!deviceId) {
    return NextResponse.json({ success: false, message: "Session expired" });
  }

  const guest = await prisma.guest.findFirst({
    where: { deviceId },
  });

  if (!guest) {
    return NextResponse.json({ success: false, message: "User not found" });
  }

  return NextResponse.json({
    success: true,
    alreadySubmitted: guest.availability !== null,
  });
}
