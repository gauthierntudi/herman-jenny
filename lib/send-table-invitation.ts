import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { getTemplateSid, sendWhatsAppTemplate } from "@/lib/twilio";

export type SendTableInvitationResult = {
  success: boolean;
  guestId: string;
  message?: string;
};

export async function sendTableInvitationForGuest(guestId: string): Promise<SendTableInvitationResult> {
  const assignment = await prisma.tableAssignment.findUnique({
    where: { guestId },
    include: { guest: true, table: true },
  });

  if (!assignment) {
    return { success: false, guestId, message: "Invité non assigné à une table" };
  }

  const { guest } = assignment;

  if (guest.sendBlocked) {
    return { success: false, guestId, message: "Envoi désactivé pour cet invité" };
  }

  if (assignment.invitationSent) {
    return { success: false, guestId, message: "Invitation déjà envoyée" };
  }

  const phone = normalizePhone(guest.phone);
  if (!phone.startsWith("+")) {
    return { success: false, guestId, message: "Numéro invalide" };
  }

  const templateSid = getTemplateSid("tableInvite");

  if (!templateSid) {
    return {
      success: false,
      guestId,
      message: "Template WhatsApp table manquant (TWILIO_TEMPLATE_TABLE_INVITE_SID)",
    };
  }

  const sendRes = await sendWhatsAppTemplate(phone, templateSid, {
    "1": guest.name.trim(),
    "2": guest.token,
  });

  if (!sendRes.success) {
    return { success: false, guestId, message: sendRes.message || "Envoi impossible" };
  }

  await prisma.tableAssignment.update({
    where: { guestId },
    data: { invitationSent: true },
  });

  return { success: true, guestId };
}
