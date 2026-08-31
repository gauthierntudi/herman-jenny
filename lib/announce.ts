export function announceGuest(name: string, tableName?: string | null) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const table = tableName?.replace(/^tables?\s*/i, "").trim();
  const text = table ? `${name}. Table ${table}.` : `${name}. Bienvenue.`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const french =
      voices.find((v) => v.lang.toLowerCase().startsWith("fr") && /female|femme|google/i.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("fr"));
    if (french) utterance.voice = french;
  };

  pickVoice();
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice, { once: true });
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function pingAlert() {
  try {
    navigator.vibrate?.([80, 40, 80]);
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    /* ignore */
  }
}
