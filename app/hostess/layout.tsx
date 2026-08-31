import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import "./hostess.css";

export const metadata: Metadata = {
  title: "Protocole",
  description: "Accueil, accompagnement et service des boissons.",
  robots: { index: false, follow: false },
  manifest: "/hostess-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Protocole HJ",
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
