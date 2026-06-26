import AdminToastContainer from "@/components/admin/AdminToastContainer";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <AdminToastContainer />
    </SessionProvider>
  );
}
