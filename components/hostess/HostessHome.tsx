"use client";

import { Bell, Footprints, Loader2, QrCode, RefreshCw, UtensilsCrossed, Wine } from "lucide-react";
import GuestAvatar from "@/components/admin/GuestAvatar";
import { Icon } from "@/components/ui/Icon";
import type { HostessTable } from "@/components/hostess/TablesDrinksView";

type Station = "entry" | "usher" | "tables" | "bar";

type Props = {
  stats: { tables: number; checkedInGuests: number; arrivedPeople: number };
  tables: HostessTable[];
  waitingGuides?: number;
  pendingOrders?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  onOpen: (station: Station) => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function HostessHome({
  stats,
  tables,
  waitingGuides = 0,
  pendingOrders = 0,
  refreshing = false,
  onRefresh,
  onOpen,
}: Props) {
  const recent = tables
    .flatMap((table) =>
      table.guests
        .filter((guest) => guest.checkedInAt)
        .map((guest) => ({ ...guest, tableName: table.name }))
    )
    .sort((a, b) => (b.checkedInAt || "").localeCompare(a.checkedInAt || ""))
    .slice(0, 6);

  return (
    <div className="hostess-home">
      <button type="button" className="hostess-refresh" onClick={onRefresh} disabled={refreshing || !onRefresh}>
        <Icon icon={refreshing ? Loader2 : RefreshCw} spin={refreshing} size={16} />
        Actualiser
      </button>
      <div className="hostess-home-stats">
        <div>
          <strong>{stats.arrivedPeople}</strong>
          <span>Arrivés</span>
        </div>
        <div>
          <strong>{waitingGuides}</strong>
          <span>À guider</span>
        </div>
        <div>
          <strong>{pendingOrders}</strong>
          <span>Au bar</span>
        </div>
      </div>

      <p className="hostess-home-section">Service accueil</p>
      <div className="hostess-home-actions">
        <button type="button" className="hostess-home-cta" onClick={() => onOpen("entry")}>
          <Icon icon={QrCode} size={26} />
          <span>
            <strong>Manager d’entrée</strong>
            <em>Scan QR + annonce</em>
          </span>
        </button>
        <button type="button" className="hostess-home-card" onClick={() => onOpen("usher")}>
          <Icon icon={Footprints} size={24} />
          <span>
            <strong>Accompagnement</strong>
            <em>Guider vers la table</em>
          </span>
        </button>
      </div>

      <p className="hostess-home-section">Service boissons</p>
      <div className="hostess-home-actions">
        <button type="button" className="hostess-home-card" onClick={() => onOpen("tables")}>
          <Icon icon={UtensilsCrossed} size={24} />
          <span>
            <strong>Protocole tables</strong>
            <em>Commander au bar</em>
          </span>
        </button>
        <button type="button" className="hostess-home-card" onClick={() => onOpen("bar")}>
          <Icon icon={Wine} size={24} />
          <span>
            <strong>Drink Manager</strong>
            <em>
              <Icon icon={Bell} size={12} /> Catalogue + plateaux
            </em>
          </span>
        </button>
      </div>

      <section className="hostess-home-recent">
        <h2>Dernières arrivées</h2>
        {recent.length === 0 ? (
          <p className="hostess-muted">Personne n’a encore été scanné.</p>
        ) : (
          <ul>
            {recent.map((guest) => (
              <li key={guest.id}>
                <GuestAvatar name={guest.name} size={36} />
                <span>
                  <strong>{guest.name}</strong>
                  <em>
                    {guest.tableName}
                    {guest.checkedInAt ? ` · ${formatTime(guest.checkedInAt)}` : ""}
                  </em>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
