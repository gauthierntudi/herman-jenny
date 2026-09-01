import { NextResponse } from "next/server";
import { ensureWelcomeSpeech } from "@/lib/welcome-tts";
import { requireHostess } from "@/lib/staff-auth";
import { hostessAnnounceSchema } from "@/lib/validators";

export const runtime = "nodejs";

async function handle(name: string) {
  const bytes = await ensureWelcomeSpeech(name);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
      "Accept-Ranges": "bytes",
    },
  });
}

export async function GET(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const name = new URL(request.url).searchParams.get("name") || "";
  const parsed = hostessAnnounceSchema.safeParse({ name });
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Nom invalide" }, { status: 400 });
  }

  try {
    return await handle(parsed.data.name);
  } catch {
    return NextResponse.json({ success: false, message: "Synthèse vocale impossible" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = hostessAnnounceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Nom invalide" }, { status: 400 });
    }
    return await handle(parsed.data.name);
  } catch {
    return NextResponse.json({ success: false, message: "Synthèse vocale impossible" }, { status: 502 });
  }
}
