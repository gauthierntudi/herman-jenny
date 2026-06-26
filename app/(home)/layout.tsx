import type { Metadata } from "next";
import "./home.css";

export const metadata: Metadata = {
  icons: {
    icon: "/assets/img/favicon.png",
  },
};

const STYLESHEETS = [
  "https://fonts.googleapis.com/css2?family=Yesteryear&display=swap",
  "/assets/css/bootstrap.css",
  "/assets/css/animate.css",
  "/assets/css/swiper-bundle.css",
  "/assets/css/slick.css",
  "/assets/css/magnific-popup.css",
  "/assets/css/spacing.css",
  "/assets/css/custom-animation.css",
  "/assets/css/main.css",
];

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      {children}
    </>
  );
}
