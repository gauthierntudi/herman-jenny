import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

export default async function InvitationCheckPage({ params }: Props) {
  const token = (await params).token.trim();

  const guest = await prisma.guest.findUnique({
    where: { token },
  });

  if (!guest) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        background: "#faf8f5",
        color: "#1a1a1a",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <p style={{ letterSpacing: "0.2em", fontSize: 12, color: "#8a7a5c", marginBottom: 8 }}>
          JENNIFER &amp; HERMAN
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>{guest.name}</h1>
      </div>
    </main>
  );
}
