"use client";

import {
  ArrowRight,
  CircleAlert,
  Download,
  Loader2,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type LookupResult = {
  guestName: string;
  downloadUrl: string;
};

type IntlTelInputInstance = {
  isValidNumber: () => boolean;
  getNumber: () => string;
  destroy: () => void;
};

declare global {
  interface Window {
    intlTelInput?: (
      input: HTMLInputElement,
      options: Record<string, unknown>
    ) => IntlTelInputInstance;
  }
}

export default function InvitationDownloadClient() {
  const phoneRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<IntlTelInputInstance | null>(null);
  const [itiReady, setItiReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  useEffect(() => {
    document.body.classList.add("invitation-page");
    return () => document.body.classList.remove("invitation-page");
  }, []);

  useEffect(() => {
    if (result) return;
    if (!itiReady || !phoneRef.current || !window.intlTelInput) return;

    itiRef.current?.destroy();
    itiRef.current = window.intlTelInput(phoneRef.current, {
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.1/build/js/utils.js",
      initialCountry: "auto",
      countrySearch: true,
      fixDropdownWidth: true,
      geoIpLookup: (success: (code: string) => void) => {
        fetch("https://ipapi.co/json/")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => success(data.country_code))
          .catch(() => success("us"));
      },
      preferredCountries: ["us", "fr", "gb", "be", "ch", "ca", "cd"],
      separateDialCode: false,
      formatOnDisplay: true,
      autoPlaceholder: "aggressive",
      nationalMode: false,
      showSelectedDialCode: true,
    });

    return () => {
      itiRef.current?.destroy();
      itiRef.current = null;
    };
  }, [itiReady, result]);

  function showError(message: string) {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const iti = itiRef.current;
    if (!iti) {
      showError("Phone input is not ready. Please refresh the page.");
      return;
    }

    if (!iti.isValidNumber()) {
      showError("Invalid number. Please check the format.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/invitations/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_phone: iti.getNumber() }),
      });
      const data = await res.json();

      if (!data.success) {
        showError(data.message || "Unable to find your invitation.");
        return;
      }

      setResult({
        guestName: data.guestName,
        downloadUrl: data.downloadUrl,
      });
    } catch {
      showError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setLoading(false);
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.1/build/js/intlTelInput.min.js"
        strategy="afterInteractive"
        onLoad={() => setItiReady(true)}
      />

      <div className="invitation-shell">
        <div className="invitation-bg" aria-hidden="true" />

        <div className={`invitation-card${shake ? " shake" : ""}`}>
          <div className="invitation-brand">
            <img src="/img/logo.png" alt="Herman & Jennifer" />
            <h1>Your Table Invitation</h1>
            <p>Enter your WhatsApp number to download your personalized invitation.</p>
          </div>

          {result ? (
            <div className="invitation-ready">
              <div className="invitation-ready-icon">
                <Icon icon={PartyPopper} size={26} />
              </div>
              <h2>Hello, {result.guestName}</h2>
              <a
                className="invitation-download"
                href={result.downloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon icon={Download} size={18} />
                Download invitation (PDF)
              </a>
              <button type="button" className="invitation-back" onClick={reset}>
                Use another number
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              {error && (
                <div className="invitation-error" role="alert">
                  <Icon icon={CircleAlert} size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="invitation-field">
                <label htmlFor="invitation-phone">WhatsApp number</label>
                <div className="invitation-phone-wrap">
                  <input
                    ref={phoneRef}
                    id="invitation-phone"
                    type="tel"
                    className="form-control"
                    placeholder="Phone number"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="invitation-submit" disabled={loading || !itiReady}>
                {loading ? (
                  <>
                    <Icon icon={Loader2} size={18} className="invitation-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    Find my invitation
                    <Icon icon={ArrowRight} size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="invitation-footer">
            <Link href="/">Wedding website</Link>
          </p>
        </div>
      </div>
    </>
  );
}
