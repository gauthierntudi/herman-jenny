"use client";

import { Check, Loader2, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import GuestAvatar from "@/components/admin/GuestAvatar";
import { Icon } from "@/components/ui/Icon";
import { pingAlert } from "@/lib/announce";
import type { HostessGuest } from "@/lib/hostess";

type Call = {
  id: string;
  status: "WAITING" | "TAKEN" | "SEATED" | "CANCELLED";
  createdAt: string;
  table: { id: string; name: string } | null;
  guest: HostessGuest;
};

export default function UsherView() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const load = async () => {
    const res = await fetch("/api/hostess/usher-calls");
    const data = await res.json();
    if (!data.success) return;
    const list = data.calls as Call[];
    if (primed.current) {
      const fresh = list.filter((c) => c.status === "WAITING" && !seen.current.has(c.id));
      if (fresh.length) pingAlert();
    }
    seen.current = new Set(list.map((c) => c.id));
    primed.current = true;
    setCalls(list);
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 2500);
    return () => window.clearInterval(id);
  }, []);

  const act = async (callId: string, action: "take" | "seat") => {
    setBusy(callId);
    try {
      await fetch("/api/hostess/usher-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, action }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="hostess-usher">
      <p className="hostess-usher-lead">Les arrivées à accompagner s’affichent ici.</p>
      {calls.length === 0 ? (
        <p className="hostess-muted">Personne n’attend un accompagnement.</p>
      ) : (
        <ul className="hostess-usher-list">
          {calls.map((call) => (
            <li key={call.id} className={`hostess-usher-card is-${call.status.toLowerCase()}`}>
              <GuestAvatar name={call.guest.name} size={52} />
              <div>
                <strong>{call.guest.name}</strong>
                <em>
                  <Icon icon={MapPin} size={14} />
                  {call.table?.name || call.guest.table?.name || "Table à confirmer"}
                </em>
              </div>
              {call.status === "WAITING" ? (
                <button type="button" disabled={busy === call.id} onClick={() => act(call.id, "take")}>
                  {busy === call.id ? <Icon icon={Loader2} spin size={16} /> : "J’accompagne"}
                </button>
              ) : (
                <button type="button" className="is-gold" disabled={busy === call.id} onClick={() => act(call.id, "seat")}>
                  {busy === call.id ? <Icon icon={Loader2} spin size={16} /> : <Icon icon={Check} size={16} />}
                  Assis
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
