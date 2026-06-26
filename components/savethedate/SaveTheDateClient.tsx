"use client";

import Script from "next/script";
import {
  ArrowRight,
  CalendarCheck,
  CalendarX2,
  Heart,
  RotateCw,
  Zap,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";

type Props = {
  slidePaths: string[];
  showExperience: boolean;
  alreadySubmitted: boolean;
};

function ExperienceView({ slidePaths }: { slidePaths: string[] }) {
  return (
    <>
      <div id="countdownOverlay" className="countdown-overlay">
        <audio id="typewriterSound" src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" preload="auto" />
        <audio id="eraseSound" src="https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" preload="auto" />
        <div className="countdown-content" id="typewriterContainer" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "nowrap" }}>
          <div id="typewriterText" style={{ fontFamily: "'GT Super',serif", fontSize: "clamp(22px,4.5vw,40px)", color: "white", textAlign: "center", letterSpacing: "0.02em", lineHeight: 1.3 }} />
          <span id="typewriterCursor" style={{ display: "inline-block", width: "2.5px", height: "1em", background: "#ffdf4b", marginLeft: "2px", verticalAlign: "middle", transform: "rotate(15deg)", transformOrigin: "center", animation: "cursorBlink 0.7s step-end infinite" }} />
        </div>
        <div id="introLoader" className="loader-wrapper">
          <div className="premium-loader" />
        </div>
      </div>

      <div className="slideshow-view" id="slideshowView">
        <div className="swiper slideshow-swiper" id="stdSwiper">
          <div className="swiper-wrapper">
            {slidePaths.map((p) => (
              <div className="swiper-slide slideshow-slide" key={p}>
                <img src={p} alt="" />
              </div>
            ))}
          </div>
        </div>
        <div className="slideshow-overlay">
          <div className="slideshow-top">Save the date</div>
          <div className="slideshow-bottom">
            <div className="slideshow-names">
              Herman <span className="amp">&amp;</span> Jennifer
            </div>
            <div className="slideshow-date">September 5, 2026</div>
          </div>
        </div>
      </div>

      <div
        id="infoScreen"
        style={{
          display: "none",
          opacity: 0,
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(rgba(255,255,255,0.94), rgba(255,255,255,0.94)), url('/img/hj-01.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 10003,
          overflowY: "auto",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 28px 120px", display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
          <div style={{ marginBottom: 8 }}>
            <img src="/img/logo01.png" alt="Logo" style={{ maxWidth: 120, height: "auto", opacity: 0.85 }} />
          </div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, lineHeight: 1.45, color: "#1c1c1e", margin: 0 }}>
            We are delighted to celebrate with you on<br />
            <strong>September 5, 2026</strong> in the USA.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.65, color: "#555", margin: 0 }}>
            On this very special day, a series of meaningful moments will celebrate our union, and you will receive invitations to the various ceremonies you are invited to attend.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.65, color: "#555", margin: 0 }}>
            Please confirm your availability for this period before <strong>May 15, 2026</strong>.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--primary-color)", margin: 0, fontStyle: "italic" }}>
            Share your journey and celebration with <strong>#TheKandeWedding</strong>.
          </p>
          <div style={{ textAlign: "left", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: "16px 16px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "#1c1c1e", marginBottom: 10 }}>
              <span>Number of people</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button type="button" id="peopleMinus" style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#1c1c1e", fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                <input id="peopleCount" type="text" defaultValue="1" readOnly style={{ width: 44, height: 32, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#1c1c1e", textAlign: "center", fontSize: 14, fontWeight: 700, padding: 0 }} />
                <button type="button" id="peoplePlus" style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#1c1c1e", fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "#1c1c1e" }}>
              <span>I live outside the USA</span>
              <input id="outsideUsaToggle" type="checkbox" style={{ width: 22, height: 22, accentColor: "var(--primary-color)" }} />
            </label>
            <div id="outsideUsaOptions" style={{ display: "none", marginTop: 12, gap: 10, flexDirection: "column" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-body)", fontSize: 14, color: "#1c1c1e" }}>
                <input id="needInvitation" type="checkbox" style={{ width: 18, height: 18, accentColor: "var(--primary-color)" }} />
                <span>I need the invitation</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-body)", fontSize: 14, color: "#1c1c1e" }}>
                <input id="needVisaAssistance" type="checkbox" style={{ width: 18, height: 18, accentColor: "var(--primary-color)" }} />
                <span>I need help with a US visa</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-body)", fontSize: 14, color: "#1c1c1e" }}>
                <input id="needHotelBooking" type="checkbox" style={{ width: 18, height: 18, accentColor: "var(--primary-color)" }} />
                <span>I need a hotel reservation</span>
              </label>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#6b6b6b", lineHeight: 1.4, marginTop: 2 }}>
                Please select at least one option.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <button type="button" id="btnConfirmAvailability" style={{ width: "100%", padding: "18px 20px", background: "#1c1c1e", color: "white", border: "none", borderRadius: 16, fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Icon icon={CalendarCheck} size={18} /> Confirm my availability
            </button>
            <button type="button" id="btnNotAvailable" style={{ width: "100%", padding: "18px 20px", background: "#c30f24", color: "white", border: "none", borderRadius: 16, fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 15px rgba(195,15,36,0.4)" }}>
              <Icon icon={CalendarX2} size={18} /> Not available
            </button>
            <button type="button" id="btnReplayFromInfo" style={{ width: "100%", padding: "18px 20px", background: "#ffd74b", color: "#221f20", border: "none", borderRadius: 16, fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Icon icon={RotateCw} size={18} /> Replay slideshow
            </button>
          </div>
        </div>
      </div>

      <div id="endOverlay" className="end-video-overlay">
        <div className="end-content">
          <Icon icon={Heart} size={48} className="heart-pulse" style={{ color: "var(--primary-color)", marginBottom: 20 }} />
          <h2>See you soon!</h2>
          <p>We can’t wait to see you.</p>
          <p style={{ fontSize: 14, opacity: 0.85, marginTop: 8, lineHeight: 1.5 }}>
            Share your journey and celebration with <strong>#TheKandeWedding</strong>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, marginTop: 24, width: "100%" }}>
            <button type="button" id="replayBtn" className="btn-replay" style={{ width: "100%", maxWidth: 280, justifyContent: "center" }}>
              <Icon icon={RotateCw} size={18} /> Replay slideshow
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function LoginView() {
  return (
    <div className="login-view">
      <div className="brand-area mobile-only">
        <img src="/img/logo.png" alt="Logo" style={{ maxWidth: 150, height: "auto", marginBottom: 20 }} />
      </div>
      <div className="login-desktop-wrapper-content">
        <div className="brand-area desktop-only" style={{ display: "none" }}>
          <img src="/img/logo.png" alt="Logo" style={{ maxWidth: 150, height: "auto", marginBottom: 20 }} />
        </div>
        <div className="login-bottom-content">
          <div className="brand-area" style={{ margin: 0, flexGrow: 0, marginBottom: 24 }}>
            <h1>Save the Date</h1>
            <p>Enter your name and WhatsApp number</p>
          </div>
          <div className="auth-card-container">
            <div className="auth-card">
              <form id="loginForm" method="POST">
                <input type="hidden" id="full_phone" name="full_phone" />
                <input type="hidden" id="url_token" name="url_token" defaultValue="" />
                <div className="form-group">
                  <input type="text" id="guest_name" name="guest_name" className="form-control" placeholder="Your name" autoComplete="name" required />
                </div>
                <div className="form-group">
                  <input type="tel" id="phone" className="form-control" placeholder="06 12 34 56 78" required />
                </div>
                <button type="submit" className="btn-submit">
                  Continue <Icon icon={ArrowRight} size={18} />
                </button>
                <div className="error-message error-message-js" style={{ display: "none" }} />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SaveTheDateClient({ slidePaths, showExperience, alreadySubmitted }: Props) {
  const slidesJson = useMemo(() => JSON.stringify(slidePaths), [slidePaths]);

  useEffect(() => {
    (window as Window & { __STD_SLIDES__?: string[]; isAlreadySubmitted?: boolean }).__STD_SLIDES__ = slidePaths;
    (window as Window & { isAlreadySubmitted?: boolean }).isAlreadySubmitted = alreadySubmitted;
  }, [slidePaths, alreadySubmitted]);

  return (
    <>
      <link rel="icon" type="image/png" href="/img/icon.png" />
      <link rel="stylesheet" href="/css/savethedate.css" />
      <link rel="stylesheet" href="/assets/css/bootstrap.css" />
      <link rel="stylesheet" href="/assets/css/swiper-bundle.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.1/build/css/intlTelInput.css" />
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap" rel="stylesheet" />

      <div className="app-container">
        <div className="bottom-sheet-overlay" id="bsOverlay" />
        <div className="bottom-sheet" id="bsModal">
          <div className="bs-icon-wrapper">
            <Icon icon={Zap} size={24} className="bs-icon" />
          </div>
          <div className="bs-title" id="bsTitle">Error</div>
          <div className="bs-message" id="bsMessage">Something went wrong.</div>
          <button type="button" className="bs-button" id="bsButton">Got it</button>
        </div>

        {showExperience ? <ExperienceView slidePaths={slidePaths} /> : <LoginView />}
      </div>

      <Script src="/js/lucide-svgs.js" strategy="beforeInteractive" />
      <Script id="std-slides" strategy="beforeInteractive">
        {`window.__STD_SLIDES__ = ${slidesJson}; window.isAlreadySubmitted = ${alreadySubmitted ? "true" : "false"};`}
      </Script>
      <Script src="https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.1/build/js/intlTelInput.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/swiper-bundle.js" strategy="afterInteractive" />
      <Script src="/assets/js/gsap.js" strategy="afterInteractive" />
      <Script src="/js/savethedate-core.js" strategy="afterInteractive" />
      {!showExperience && <Script src="/js/savethedate-login.js" strategy="afterInteractive" />}
    </>
  );
}
