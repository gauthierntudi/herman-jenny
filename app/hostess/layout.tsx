import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import "./hostess.css";

export const metadata: Metadata = {
  title: "Hôtesses",
  description: "Check-in des invitations et gestion des boissons par table.",
  robots: { index: false, follow: false },
  manifest: "/hostess-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hôtesses HJ",
  },
  icons: {
    icon: [{ url: "/img/icon.png", type: "image/png" }],
    apple: [{ url: "/img/icon.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#121214",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export default function HostessLayout({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
