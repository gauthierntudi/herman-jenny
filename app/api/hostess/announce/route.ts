import { NextResponse } from "next/server";
import { requireHostess } from "@/lib/staff-auth";
import { hostessAnnounceSchema } from "@/lib/validators";
import { welcomeSpeechText } from "@/lib/welcome-speech";

export const runtime = "nodejs";

const cache = new Map<string, { bytes: Buffer; type: string }>();
const MAX_CACHE = 200;

function openaiKey() {
  return process.env.TOKEN_OPENAI || process.env.OPENAI_API_KEY || "";
}

export async function POST(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const key = openaiKey();
  if (!key) {
    return NextResponse.json({ success: false, message: "TTS indisponible" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = hostessAnnounceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Nom invalide" }, { status: 400 });
    }

    const name = parsed.data.name;
    const cached = cache.get(name);
    if (cached) {
      return new NextResponse(new Uint8Array(cached.bytes), {
        headers: {
          "Content-Type": cached.type,
          "Cache-Control": "no-store",
        },
      });
    }

    const voice = process.env.OPENAI_TTS_VOICE || "coral";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: welcomeSpeechText(name),
        instructions:
          "Parle en français de France, voix féminine chaleureuse et élégante, comme une hôtesse d’accueil lors d’un mariage. Débit clair, souriant, sans précipitation.",
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, message: "Synthèse vocale impossible" }, { status: 502 });
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const type = response.headers.get("content-type") || "audio/mpeg";
    if (cache.size >= MAX_CACHE) cache.clear();
    cache.set(name, { bytes, type });

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}
