import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

export default async function InvitationCheckPage({ params }: Props) {
  const token = (await params).token.trim();
  const session = await auth();

  if (session?.user) {
    redirect(`/hostess?token=${encodeURIComponent(token)}`);
  }

  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { tableAssignment: { include: { table: true } } },
  });

  if (!guest) notFound();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "Georgia, serif",
        background: "#121214",
        color: "#f4efe4",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <p style={{ letterSpacing: "0.28em", fontSize: 11, color: "#fed202", marginBottom: 12 }}>
          JENNIFER &amp; HERMAN
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 400, margin: "0 0 12px" }}>{guest.name}</h1>
        {guest.tableAssignment?.table && (
          <p style={{ margin: 0, opacity: 0.7, fontFamily: "system-ui, sans-serif" }}>
            {guest.tableAssignment.table.name}
          </p>
        )}
        <p style={{ marginTop: 32, fontSize: 13, fontFamily: "system-ui, sans-serif", opacity: 0.45 }}>
          <a href="/hostess" style={{ color: "#fed202" }}>
            Espace hôtesses
          </a>
        </p>
      </div>
    </main>
  );
}
