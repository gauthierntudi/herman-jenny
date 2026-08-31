"use client";

import {
  Check,
  Keyboard,
  Loader2,
  QrCode,
  Search,
  Undo2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import GuestAvatar from "@/components/admin/GuestAvatar";
import QrScanner from "@/components/hostess/QrScanner";
import { Icon } from "@/components/ui/Icon";
import type { HostessGuest } from "@/lib/hostess";

type Props = {
  initialToken?: string;
  onServeTable: (tableId: string) => void;
  onCheckinChange?: () => void;
};

function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function CheckInView({ initialToken, onServeTable, onCheckinChange }: Props) {
  const [mode, setMode] = useState<"scan" | "search">(initialToken ? "search" : "scan");
  const [query, setQuery] = useState(initialToken || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<HostessGuest | null>(null);
  const [matches, setMatches] = useState<HostessGuest[]>([]);
  const [people, setPeople] = useState(1);
  const [saving, setSaving] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [lastScan, setLastScan] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lookupSeq = useRef(0);

  const lookup = async (value: string, opts?: { live?: boolean; signal?: AbortSignal }) => {
    const q = value.trim();
    if (!q) {
      setMatches([]);
      setError("");
      if (opts?.live) setGuest(null);
      return;
    }
    if (!opts?.live && q.length < 2) return;

    const seq = ++lookupSeq.current;
    if (!opts?.live) {
      setLoading(true);
      setMatches([]);
    }
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("q", q);
      if (opts?.live) params.set("live", "1");
      const res = await fetch(`/api/hostess/guest?${params}`, { signal: opts?.signal });
      const data = await res.json();
      if (seq !== lookupSeq.current) return;

      if (!data.success) {
        setGuest(null);
        setMatches([]);
        setError(data.message || "Invitation introuvable.");
        return;
      }

      const list = (data.guests || []) as HostessGuest[];
      setMatches(list);

      if (opts?.live) {
        setGuest(null);
        setError(q.length >= 2 && list.length === 0 ? "Aucun invité ne correspond." : "");
        return;
      }

      if (data.guest) {
        setGuest(data.guest);
        setPeople(data.guest.checkedInCount || data.guest.peopleCount || 1);
      } else {
        setGuest(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (seq !== lookupSeq.current) return;
      setGuest(null);
      setMatches([]);
      setError("Connexion impossible. Réessayez.");
    } finally {
      if (seq === lookupSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) lookup(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  useEffect(() => {
    if (mode !== "search") return;
    searchInputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (mode !== "search" || guest) return;

    const q = query.trim();
    if (q.length < 2) {
      setMatches([]);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      lookup(q, { live: true, signal: controller.signal });
    }, 140);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode, guest]);

  const onScan = (value: string) => {
    if (value === lastScan) return;
    setLastScan(value);
    setMode("search");
    setQuery(value);
    lookup(value);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (matches[0]) {
      setGuest(matches[0]);
      setPeople(matches[0].checkedInCount || matches[0].peopleCount || 1);
      return;
    }
    lookup(query);
  };

  const checkin = async (action: "checkin" | "undo") => {
    if (!guest) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/hostess/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: guest.id,
          action,
          peopleCount: people,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Impossible de valider.");
        return;
      }
      setGuest(data.guest);
      if (action === "checkin") {
        setStamped(true);
        navigator.vibrate?.(40);
        setTimeout(() => setStamped(false), 1400);
      }
      onCheckinChange?.();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const peopleOptions = useMemo(() => {
    const max = Math.max(guest?.peopleCount || 1, 4);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [guest]);

  return (
    <div className={`hostess-checkin${mode === "scan" && !guest ? " is-scanning" : ""}`}>
      <div className="hostess-segment">
        <button
          type="button"
          className={mode === "scan" ? "is-active" : ""}
          onClick={() => {
            setMode("scan");
            setError("");
          }}
        >
          <Icon icon={QrCode} size={16} />
          Scanner
        </button>
        <button
          type="button"
          className={mode === "search" ? "is-active" : ""}
          onClick={() => setMode("search")}
        >
          <Icon icon={Keyboard} size={16} />
          Rechercher
        </button>
      </div>

      {mode === "scan" ? (
        <QrScanner active={mode === "scan" && !guest} onScan={onScan} />
      ) : (
        <form className="hostess-search" onSubmit={onSearch}>
          <Icon icon={Search} size={18} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (guest) setGuest(null);
            }}
            placeholder="Nom, téléphone…"
            autoCapitalize="words"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />
          {loading ? <Icon icon={Loader2} spin size={18} /> : null}
        </form>
      )}

      {loading && !matches.length && query.trim().length >= 2 && !guest && (
        <p className="hostess-status">
          <Icon icon={Loader2} spin size={16} />
          Recherche…
        </p>
      )}
      {error && !matches.length && <p className="hostess-error">{error}</p>}

      {!guest && matches.length > 0 && (
        <ul className="hostess-matches">
          {matches.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setGuest(item);
                  setPeople(item.checkedInCount || item.peopleCount || 1);
                }}
              >
                <GuestAvatar name={item.name} size={40} />
                <span>
                  <strong>{item.name}</strong>
                  <em>{item.table ? item.table.name : "Sans table"}</em>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {guest && (
        <article className={`hostess-ticket${guest.checkedInAt ? " is-in" : ""}`}>
          {stamped && <div className="hostess-stamp">Arrivé</div>}
          <div className="hostess-ticket-top">
            <GuestAvatar name={guest.name} size={56} />
            <div>
              <p className="hostess-kicker">Invitation</p>
              <h2>{guest.name}</h2>
              <p className="hostess-ticket-meta">
                <Icon icon={Users} size={14} />
                {guest.peopleCount} pers.
                {guest.table ? ` · ${guest.table.name}` : " · Pas de table"}
              </p>
            </div>
          </div>

          {guest.checkedInAt ? (
            <p className="hostess-in-badge">
              <Icon icon={Check} size={16} />
              Arrivé à {formatTime(guest.checkedInAt)}
              {guest.checkedInCount ? ` · ${guest.checkedInCount} pers.` : ""}
            </p>
          ) : (
            <div className="hostess-people">
              <span>Personnes présentes</span>
              <div>
                {peopleOptions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={people === n ? "is-active" : ""}
                    onClick={() => setPeople(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!guest.table && (
            <p className="hostess-warn">Cet invité n’a pas encore de table assignée.</p>
          )}

          <div className="hostess-ticket-actions">
            {guest.checkedInAt ? (
              <button
                type="button"
                className="hostess-btn hostess-btn-ghost"
                disabled={saving}
                onClick={() => checkin("undo")}
              >
                <Icon icon={Undo2} size={16} />
                Annuler l’arrivée
              </button>
            ) : (
              <button
                type="button"
                className="hostess-btn hostess-btn-gold"
                disabled={saving}
                onClick={() => checkin("checkin")}
              >
                {saving ? <Icon icon={Loader2} spin size={18} /> : <Icon icon={Check} size={18} />}
                Confirmer l’arrivée
              </button>
            )}
            {guest.table && (
              <button
                type="button"
                className="hostess-btn hostess-btn-ghost"
                onClick={() => onServeTable(guest.table!.id)}
              >
                <Icon icon={UtensilsCrossed} size={16} />
                Boissons {guest.table.name}
              </button>
            )}
            <button
              type="button"
              className="hostess-btn hostess-btn-ghost"
              onClick={() => {
                setGuest(null);
                setMatches([]);
                setQuery("");
                setLastScan("");
                setMode("scan");
              }}
            >
              Scanner un autre
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
