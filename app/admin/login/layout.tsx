import type { Metadata } from "next";
import "./admin-login.css";

export const metadata: Metadata = {
  title: "Admin — Kande's Wedding",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
        precedence="default"
      />
      {children}
    </>
  );
}
