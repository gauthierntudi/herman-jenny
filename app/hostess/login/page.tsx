import { redirect } from "next/navigation";
import HostessLoginForm from "@/components/hostess/HostessLoginForm";
import { getStaffSession } from "@/lib/staff-auth";

export default async function HostessLoginPage() {
  const staff = await getStaffSession();
  if (staff) redirect("/hostess");

  return <HostessLoginForm />;
}
