import type { Metadata } from "next";
import "../styles/lucide.css";

export const metadata: Metadata = {
  title: "Herman & Jenny - Wedding",
  description:
    "From Kinshasa to the United States, our journey is one of faith, love, and purpose.",
  icons: {
    icon: "/assets/img/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "https://jennifer-herman.com/",
    title: "Herman & Jenny - Wedding",
    description:
      "From Kinshasa to the United States, our journey is one of faith, love, and purpose.",
    images: [{ url: "https://jennifer-herman.com/img/wedd02.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
