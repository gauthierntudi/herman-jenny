"use client";

import { signIn } from "next-auth/react";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export default function HostessLoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add("hostess-page", "hostess-login-page");
    return () => document.body.classList.remove("hostess-page", "hostess-login-page");
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const sync = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboard(covered);
    };

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const next = new URLSearchParams(window.location.search).get("next") || "/hostess";

    const result = await signIn("credentials", {
      password,
      redirect: false,
    });

    if (result?.ok) {
      window.location.href = next.startsWith("/hostess") ? next : "/hostess";
      return;
    }

    setError("Code incorrect.");
    setShake(true);
    navigator.vibrate?.([40, 40, 40]);
    setLoading(false);
    inputRef.current?.select();
    window.setTimeout(() => setShake(false), 420);
  }

  const keyboardOpen = keyboard > 80 || focused;

  return (
    <div className={`hostess-login${keyboardOpen ? " is-keyboard" : ""}`}>
      <div className="hostess-login-photo" aria-hidden="true" />

      <header className="hostess-login-top">
        <img src="/img/logo.png" alt="" />
        <p className="hostess-kicker">Jennifer &amp; Herman</p>
      </header>

      <div className="hostess-login-hero">
        <p className="hostess-login-seal">Équipe du jour</p>
        <h1>Hôtesses</h1>
        <p className="hostess-login-lead">Check-in · Tables · Bar</p>
      </div>

      <form
        className={`hostess-login-sheet${shake ? " shake" : ""}`}
        onSubmit={onSubmit}
        style={{ paddingBottom: `calc(16px + env(safe-area-inset-bottom) + ${keyboard}px)` }}
      >
        <p className="hostess-login-ticket">Pass d’entrée</p>
        <label htmlFor="hostess-password">Code équipe</label>
        <div className="hostess-login-field">
          <input
            ref={inputRef}
            id="hostess-password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Votre code"
            required
            disabled={loading}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <button
            type="button"
            className="hostess-login-eye"
            onClick={() => {
              setShowPassword((v) => !v);
              inputRef.current?.focus();
            }}
            aria-label={showPassword ? "Masquer le code" : "Afficher le code"}
          >
            <Icon icon={showPassword ? EyeOff : Eye} size={20} />
          </button>
        </div>

        {error && (
          <p className="hostess-login-error" role="alert">
            <Icon icon={CircleAlert} size={16} />
            {error}
          </p>
        )}

        <button type="submit" className="hostess-login-go" disabled={loading}>
          {loading ? (
            <>
              <Icon icon={Loader2} spin size={20} />
              Ouverture…
            </>
          ) : (
            "Déverrouiller"
          )}
        </button>
      </form>
    </div>
  );
}
