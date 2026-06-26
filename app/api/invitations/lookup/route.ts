import { NextResponse } from "next/server";
import { getInvitationPdfUrl } from "@/lib/invitation-pdf";
import { prisma } from "@/lib/prisma";
import { isValidE164, normalizePhone } from "@/lib/phone";
import { invitationLookupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = invitationLookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(parsed.data.full_phone);

    if (!isValidE164(phone)) {
      return NextResponse.json(
        { success: false, message: "Invalid number. Please check the format." },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { phone },
      include: { tableAssignment: { include: { table: true } } },
    });

    if (!guest) {
      return NextResponse.json({
        success: false,
        message: "This number is not on our guest list. Please use the WhatsApp number you registered with.",
      });
    }

    if (!guest.tableAssignment?.table) {
      return NextResponse.json({
        success: false,
        message: "Your table has not been assigned yet. Please check back later.",
      });
    }

    return NextResponse.json({
      success: true,
      guestName: guest.name,
      downloadUrl: getInvitationPdfUrl(guest.token),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
