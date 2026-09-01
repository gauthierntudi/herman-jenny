import { welcomeSpeechText } from "@/lib/welcome-speech";

const cache = new Map<string, Buffer>();
const pending = new Map<string, Promise<Buffer>>();
const MAX_CACHE = 300;

function openaiKey() {
  return process.env.TOKEN_OPENAI || process.env.OPENAI_API_KEY || "";
}

async function generateWelcomeSpeech(name: string) {
  const key = openaiKey();
  if (!key) throw new Error("missing-key");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "coral",
      input: welcomeSpeechText(name),
      instructions:
        "Parle en français de France, voix féminine chaleureuse et élégante, comme une hôtesse d’accueil lors d’un mariage. Débit clair, souriant, sans précipitation.",
      response_format: "mp3",
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("tts-failed");
  }

  return Buffer.from(await response.arrayBuffer());
}

export function prefetchWelcomeSpeech(name: string) {
  const trimmed = name.trim();
  if (!trimmed || !openaiKey()) return;
  void ensureWelcomeSpeech(trimmed).catch(() => {});
}

export async function ensureWelcomeSpeech(name: string) {
  const trimmed = name.trim();
  const hit = cache.get(trimmed);
  if (hit) return hit;

  const existing = pending.get(trimmed);
  if (existing) return existing;

  const job = generateWelcomeSpeech(trimmed)
    .then((bytes) => {
      if (cache.size >= MAX_CACHE) cache.clear();
      cache.set(trimmed, bytes);
      return bytes;
    })
    .finally(() => {
      pending.delete(trimmed);
    });

  pending.set(trimmed, job);
  return job;
}
