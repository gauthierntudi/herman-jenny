import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeviceId } from "@/lib/guest-cookies";
import { availabilitySchema } from "@/lib/validators";
import { getTemplateSid, sendWhatsAppTemplate } from "@/lib/twilio";

export async function POST(request: Request) {
  const deviceId = await getDeviceId();

  if (!deviceId) {
    return NextResponse.json({
      success: false,
      message: "Session expired. Please reload the page.",
    });
  }

  try {
    const body = await request.json();
    const parsed = availabilitySchema.safeParse({
      availability: body.availability !== false && body.availability !== "false",
      outside_usa: body.outside_usa === true || body.outside_usa === "true" || body.outside_usa === "1",
      people_count: Number(body.people_count),
      need_invitation:
        body.need_invitation === true || body.need_invitation === "true" || body.need_invitation === "1",
      need_visa_assistance:
        body.need_visa_assistance === true ||
        body.need_visa_assistance === "true" ||
        body.need_visa_assistance === "1",
      need_hotel_booking:
        body.need_hotel_booking === true ||
        body.need_hotel_booking === "true" ||
        body.need_hotel_booking === "1",
    });

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid data.";
      return NextResponse.json({ success: false, message: msg });
    }

    const data = parsed.data;
    const guest = await prisma.guest.findFirst({ where: { deviceId } });

    if (!guest) {
      return NextResponse.json({
        success: false,
        message: "User not found or device not recognized.",
      });
    }

    const availability =
      body.availability === false || body.availability === "false" ? false : true;

    const updated = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        availability,
        outsideUsa: data.outside_usa,
        peopleCount: data.people_count,
        needInvitation: data.need_invitation,
        needVisaAssistance: data.need_visa_assistance,
        needHotelBooking: data.need_hotel_booking,
      },
    });

    let whatsappSent = false;
    let whatsappError: string | null = null;

    if (updated.phone) {
      const sendRes = await sendWhatsAppTemplate(
        updated.phone,
        getTemplateSid("confirm"),
        { "1": updated.name || "" }
      );
      whatsappSent = sendRes.success;
      whatsappError = sendRes.success ? null : sendRes.message || "Unable to send";
    }

    return NextResponse.json({
      success: true,
      whatsappSent,
      whatsappError,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server write error." },
      { status: 500 }
    );
  }
}
