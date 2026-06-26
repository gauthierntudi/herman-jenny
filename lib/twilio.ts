import twilio from "twilio";
import { normalizePhone } from "./phone";

export type TwilioSendResult = {
  success: boolean;
  message?: string;
  httpCode?: number;
};

export async function sendWhatsAppTemplate(
  toE164: string,
  contentSid: string,
  variables: Record<string, string>
): Promise<TwilioSendResult> {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  let from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+243992779382";

  if (!from.startsWith("whatsapp:")) {
    from = `whatsapp:${from}`;
  }

  const to = normalizePhone(toE164);
  if (!to.startsWith("+")) {
    return { success: false, message: "Invalid recipient number" };
  }

  const trimmedSid = contentSid.trim();
  if (!trimmedSid) {
    return { success: false, message: "Missing ContentSid" };
  }

  if (!sid || !token) {
    return { success: false, message: "Twilio credentials missing" };
  }

  try {
    const client = twilio(sid, token);
    await client.messages.create({
      from,
      to: `whatsapp:${to}`,
      contentSid: trimmedSid,
      contentVariables: JSON.stringify(variables),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio error";
    return { success: false, message };
  }
}

export function getTemplateSid(key: "confirm" | "invite" | "admin" | "tableInvite"): string {
  const map = {
    confirm: process.env.TWILIO_TEMPLATE_CONFIRM_SID || "HXa74e9f249f4b652cf0d69c418490fdc8",
    invite: process.env.TWILIO_TEMPLATE_INVITE_SID || "HX517ad34369fc9f7e98363d0f7f14544a",
    admin: process.env.TWILIO_TEMPLATE_ADMIN_SID || "HX9ff3c1e57ed057e3a2653710f8aad2a4",
    tableInvite: process.env.TWILIO_TEMPLATE_TABLE_INVITE_SID || "",
  };
  return map[key];
}
