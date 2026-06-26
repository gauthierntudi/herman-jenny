import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { sendTableInvitationForGuest } from "@/lib/send-table-invitation";
import { getTemplateSid, sendWhatsAppTemplate } from "@/lib/twilio";
import { toggleBlockedSchema, whatsappBulkSchema, whatsappRecipientSchema, sendTableInvitationSchema, sendTableInvitationBulkSchema } from "@/lib/validators";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as string;

  if (action === "send_whatsapp") {
    const parsed = whatsappRecipientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid recipient" });
    }

    const phone = normalizePhone(parsed.data.phone);
    const guest = await prisma.guest.findUnique({ where: { phone } });

    if (guest?.sendBlocked) {
      return NextResponse.json({ success: false, message: "Sending disabled for this guest" });
    }

    const sendRes = await sendWhatsAppTemplate(phone, getTemplateSid("invite"), {
      "1": parsed.data.name,
    });

    if (sendRes.success) {
      await prisma.guest.updateMany({
        where: { phone },
        data: { statusSend: true },
      });
      return NextResponse.json({ success: true, message: `Message sent to ${parsed.data.name}` });
    }

    return NextResponse.json({ success: false, message: sendRes.message || "Unable to send" });
  }

  if (action === "toggle_uncertain") {
    const parsed = toggleBlockedSchema.safeParse({
      phone: body.phone,
      blocked: body.blocked === true || body.blocked === "true" || body.blocked === "1",
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Missing phone" });
    }

    const phone = normalizePhone(parsed.data.phone);
    const guest = await prisma.guest.findUnique({ where: { phone } });

    if (!guest) {
      return NextResponse.json({ success: false, message: "Guest not found" });
    }

    await prisma.guest.update({
      where: { phone },
      data: { sendBlocked: parsed.data.blocked },
    });

    return NextResponse.json({ success: true, blocked: parsed.data.blocked });
  }

  if (action === "send_whatsapp_bulk") {
    const parsed = whatsappBulkSchema.safeParse({
      recipients: typeof body.recipients === "string" ? JSON.parse(body.recipients) : body.recipients,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "No recipients provided" });
    }

    const results: Array<{ phone: string; name: string; success: boolean; message?: string }> = [];
    let sent = 0;

    for (const r of parsed.data.recipients) {
      const phone = normalizePhone(r.phone);
      const name = r.name.trim();

      if (!phone || !name) {
        results.push({ phone, name, success: false, message: "Invalid recipient" });
        continue;
      }

      const guest = await prisma.guest.findUnique({ where: { phone } });

      if (guest?.sendBlocked) {
        results.push({ phone, name, success: false, message: "Sending disabled" });
        continue;
      }

      if (guest?.statusSend) {
        results.push({ phone, name, success: false, message: "Already sent" });
        continue;
      }

      const sendRes = await sendWhatsAppTemplate(phone, getTemplateSid("invite"), { "1": name });

      if (sendRes.success) {
        sent++;
        await prisma.guest.updateMany({ where: { phone }, data: { statusSend: true } });
        results.push({ phone, name, success: true });
      } else {
        results.push({ phone, name, success: false, message: sendRes.message || "Unable to send" });
      }
    }

    return NextResponse.json({ success: true, sent, total: results.length, results });
  }

  if (action === "send_whatsapp_custom") {
    const recipientsSchema = z.array(
      z.object({ name: z.string(), phone: z.string() })
    );
    const recipients = recipientsSchema.safeParse(
      typeof body.recipients === "string" ? JSON.parse(body.recipients) : body.recipients
    );

    if (!recipients.success || !recipients.data.length) {
      return NextResponse.json({ success: false, message: "No recipients provided" });
    }

    const results: Array<{ name: string; phone: string; success: boolean; message: string }> = [];
    let ok = 0;

    for (const r of recipients.data) {
      const name = r.name.trim();
      const phone = normalizePhone(r.phone);

      if (!name || !phone) {
        results.push({ name, phone, success: false, message: "Invalid recipient" });
        continue;
      }

      const sendRes = await sendWhatsAppTemplate(phone, getTemplateSid("admin"), { "1": name });
      if (sendRes.success) ok++;
      results.push({
        name,
        phone,
        success: sendRes.success,
        message: sendRes.message || "",
      });
    }

    return NextResponse.json({ success: true, sent: ok, total: results.length, results });
  }

  if (action === "send_table_invitation") {
    const parsed = sendTableInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Destinataire invalide" });
    }

    const result = await sendTableInvitationForGuest(parsed.data.guestId, {
      resend: parsed.data.resend,
    });

    if (result.success) {
      return NextResponse.json({ success: true, guestId: result.guestId });
    }

    return NextResponse.json({ success: false, message: result.message || "Envoi impossible" });
  }

  if (action === "send_table_invitation_bulk") {
    const parsed = sendTableInvitationBulkSchema.safeParse({
      recipients: typeof body.recipients === "string" ? JSON.parse(body.recipients) : body.recipients,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Aucun destinataire" });
    }

    const results: Array<{ guestId: string; phone: string; name: string; success: boolean; message?: string }> = [];
    let sent = 0;

    for (const r of parsed.data.recipients) {
      const phone = normalizePhone(r.phone);
      const name = r.name.trim();

      if (!phone || !name) {
        results.push({ guestId: r.guestId, phone, name, success: false, message: "Destinataire invalide" });
        continue;
      }

      const result = await sendTableInvitationForGuest(r.guestId, { resend: r.resend });

      if (result.success) {
        sent++;
        results.push({ guestId: r.guestId, phone, name, success: true });
      } else {
        results.push({
          guestId: r.guestId,
          phone,
          name,
          success: false,
          message: result.message || "Envoi impossible",
        });
      }
    }

    return NextResponse.json({ success: true, sent, total: results.length, results });
  }

  return NextResponse.json({ success: false, message: "Unknown action" });
}
