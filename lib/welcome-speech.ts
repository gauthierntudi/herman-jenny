export function welcomeSpeechText(guestName: string) {
  const name = guestName.trim().replace(/\s+/g, " ");
  return `Bienvenue ${name}. Jennifer et Herman te souhaitent une bonne fête.`;
}
