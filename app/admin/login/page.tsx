"use client";

import { signIn } from "next-auth/react";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export default function AdminLoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    document.body.classList.add("admin-login-page");
    return () => document.body.classList.remove("admin-login-page");
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");

    const result = await signIn("credentials", {
      password,
      redirect: false,
    });

    if (result?.ok) {
      window.location.href = "/admin";
      return;
    }

    setError("Mot de passe incorrect. Veuillez réessayer.");
    setShake(true);
    setLoading(false);
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className="admin-login-shell">
      <div className="admin-login-bg" aria-hidden="true" />

      <div className={`admin-login-card${shake ? " shake" : ""}`}>
        <div className="admin-login-brand">
          <img src="/img/logo.png" alt="Kande's Wedding" />
          <h1>Kande&apos;s Wedding</h1>
          <p>Gestion des invitations et RSVP</p>
          <span className="admin-login-badge">
            <Icon icon={Shield} size={14} />
            Espace admin
          </span>
        </div>

        {error && (
          <div className="admin-login-error" role="alert">
            <Icon icon={CircleAlert} size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="admin-login-field">
            <label htmlFor="admin-password">Mot de passe</label>
            <div className="admin-login-input-wrap">
              <Icon icon={Lock} size={16} className="field-icon" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="admin-login-input"
                placeholder="Entrez votre mot de passe"
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="admin-login-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                <Icon icon={showPassword ? EyeOff : Eye} size={18} />
              </button>
            </div>
          </div>

          <button type="submit" className="admin-login-submit" disabled={loading}>
            {loading ? (
              <>
                <Icon icon={Loader2} spin size={18} />
                Connexion...
              </>
            ) : (
              <>
                Se connecter
                <Icon icon={ArrowRight} size={18} />
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link href="/">← Retour au site</Link>
        </div>
      </div>
    </div>
  );
}
