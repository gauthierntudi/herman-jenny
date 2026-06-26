import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/AdminDashboard";
import "./admin-dashboard.css";

type Tab = "guests" | "whatsapp" | "tables" | "invitations";

function parseTab(tab?: string): Tab {
  if (tab === "whatsapp" || tab === "tables" || tab === "invitations") return tab;
  return "guests";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const { tab: tabParam } = await searchParams;
  const initialTab = parseTab(tabParam);

  const guests = await prisma.guest.findMany({ orderBy: { name: "asc" } });

  const tables = await prisma.weddingTable.findMany({
    orderBy: { name: "asc" },
    include: {
      assignments: {
        include: { guest: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return <AdminDashboard guests={guests} initialTables={tables} initialTab={initialTab} />;
}
