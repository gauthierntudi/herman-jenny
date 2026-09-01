import { NextResponse } from "next/server";
import { extractInvitationToken } from "@/lib/invitation-token";
import { guestTableInclude, serializeHostessGuest } from "@/lib/hostess";
import { prisma } from "@/lib/prisma";
import { requireHostess } from "@/lib/staff-auth";
import { prefetchWelcomeSpeech } from "@/lib/welcome-tts";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function searchWords(q: string) {
  return q
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 1);
}

export async function GET(request: Request) {
  const staff = await requireHostess();
  if (!staff) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tokenParam = searchParams.get("token")?.trim() || "";
  const q = searchParams.get("q")?.trim() || "";
  const live = searchParams.get("live") === "1";

  const token = extractInvitationToken(tokenParam) || extractInvitationToken(q);

  try {
    if (token) {
      const guest = await prisma.guest.findUnique({
        where: { token },
        include: guestTableInclude,
      });

      if (!guest) {
        if (live) {
          return NextResponse.json({ success: true, guest: null, guests: [] });
        }
        return NextResponse.json({
          success: false,
          message: "Invitation introuvable. Vérifiez le QR code.",
        });
      }

      prefetchWelcomeSpeech(guest.name);
      return NextResponse.json({
        success: true,
        guest: serializeHostessGuest(guest),
        guests: [serializeHostessGuest(guest)],
      });
    }

    if (q.length < 2) {
      if (live) {
        return NextResponse.json({ success: true, guest: null, guests: [] });
      }
      return NextResponse.json({
        success: false,
        message: "Saisissez un nom, un téléphone ou scannez le QR.",
      });
    }

    const words = searchWords(q);
    const phoneDigits = digits(q);
    const guests = await prisma.guest.findMany({
      where: {
        OR: [
          {
            AND: words.map((word) => ({
              name: { contains: word, mode: "insensitive" as const },
            })),
          },
          ...(phoneDigits.length >= 3 ? [{ phone: { contains: phoneDigits } }] : []),
        ],
      },
      include: guestTableInclude,
      orderBy: { name: "asc" },
      take: 12,
    });

    const first = words[0]?.toLowerCase() ?? "";
    const ranked = [...guests].sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(first) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(first) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name, "fr");
    });

    if (ranked.length === 0) {
      if (live) {
        return NextResponse.json({ success: true, guest: null, guests: [] });
      }
      return NextResponse.json({
        success: false,
        message: "Aucun invité ne correspond.",
      });
    }

    const serialized = ranked.map(serializeHostessGuest);
    const selected = live ? null : serialized.length === 1 ? serialized[0] : null;
    if (selected) prefetchWelcomeSpeech(selected.name);
    return NextResponse.json({
      success: true,
      guest: selected,
      guests: serialized,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Erreur serveur. Réessayez." },
      { status: 500 }
    );
  }
}
