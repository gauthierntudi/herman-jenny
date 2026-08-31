import { auth } from "@/auth";

export type StaffRole = "admin" | "hostess";

export type StaffSession = {
  role: StaffRole;
  user: { name?: string | null };
};

export function roleFromSession(role?: string | null): StaffRole {
  return role === "hostess" ? "hostess" : "admin";
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    role: roleFromSession(session.user.role),
    user: { name: session.user.name },
  };
}

export async function requireAdmin(): Promise<StaffSession | null> {
  const staff = await getStaffSession();
  if (!staff || staff.role !== "admin") return null;
  return staff;
}

export async function requireHostess(): Promise<StaffSession | null> {
  return getStaffSession();
}
