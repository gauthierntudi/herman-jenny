import type { Metadata } from "next";
import "../styles/lucide.css";

const SITE_URL = "https://jennifer-herman.com";
const SITE_TITLE = "Herman & Jennifer — Wedding";
const SITE_DESCRIPTION =
  "From Kinshasa to the United States, our journey is one of faith, love, and purpose.";
const SITE_ICON = `${SITE_URL}/img/icon.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Herman & Jennifer",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: "/img/icon.png", type: "image/png" }],
    shortcut: "/img/icon.png",
    apple: [{ url: "/img/icon.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Herman & Jennifer",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_ICON,
        width: 930,
        height: 930,
        alt: "Herman & Jennifer",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_ICON],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
