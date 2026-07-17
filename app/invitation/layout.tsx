import type { Metadata } from "next";
import "./invitation.css";

export const metadata: Metadata = {
  title: "Your Invitation — Herman & Jennifer",
  description: "Download your personalized wedding table invitation.",
  robots: { index: false, follow: false },
};

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.1/build/css/intlTelInput.css"
        precedence="default"
      />
      {children}
    </>
  );
}
