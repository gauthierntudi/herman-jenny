import { redirect } from "next/navigation";
import HostessApp from "@/components/hostess/HostessApp";
import { getStaffSession } from "@/lib/staff-auth";

export default async function HostessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const staff = await getStaffSession();
  if (!staff) redirect("/hostess/login");

  const { token } = await searchParams;

  return <HostessApp role={staff.role} initialToken={token} />;
}
