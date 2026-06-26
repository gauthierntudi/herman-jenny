export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function isValidE164(phone: string): boolean {
  return /^\+\d{8,15}$/.test(normalizePhone(phone));
}

export function toWhatsAppAddress(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized.startsWith("+") ? `whatsapp:${normalized}` : `whatsapp:+${normalized}`;
}
