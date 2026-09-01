import { welcomeSpeechText } from "@/lib/welcome-speech";

let player: HTMLAudioElement | null = null;
const urlCache = new Map<string, string>();

function getPlayer() {
  if (!player) {
    player = new Audio();
    player.preload = "auto";
  }
  return player;
}

function speakBrowser(name: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(welcomeSpeechText(name));
  utterance.lang = "fr-FR";
  utterance.rate = 0.92;
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

export async function announceGuest(name: string) {
  if (typeof window === "undefined") return;

  window.speechSynthesis?.cancel();
  const audio = getPlayer();
  audio.pause();

  try {
    let src = urlCache.get(name);
    if (!src) {
      const res = await fetch("/api/hostess/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("tts");
      const blob = await res.blob();
      src = URL.createObjectURL(blob);
      urlCache.set(name, src);
    }
    audio.src = src;
    await audio.play();
  } catch {
    speakBrowser(name);
  }
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
