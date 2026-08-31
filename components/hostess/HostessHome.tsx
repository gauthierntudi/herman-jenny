"use client";

import { QrCode, UtensilsCrossed } from "lucide-react";
import GuestAvatar from "@/components/admin/GuestAvatar";
import { Icon } from "@/components/ui/Icon";
import type { HostessTable } from "@/components/hostess/TablesDrinksView";

type Props = {
  stats: { tables: number; checkedInGuests: number; arrivedPeople: number };
  tables: HostessTable[];
  onCheckin: () => void;
  onTables: () => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function HostessHome({ stats, tables, onCheckin, onTables }: Props) {
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
      <div className="hostess-home-stats">
        <div>
          <strong>{stats.arrivedPeople}</strong>
          <span>Arrivés</span>
        </div>
        <div>
          <strong>{stats.checkedInGuests}</strong>
          <span>Invitations</span>
        </div>
        <div>
          <strong>{stats.tables}</strong>
          <span>Tables</span>
        </div>
      </div>

      <div className="hostess-home-actions">
        <button type="button" className="hostess-home-cta" onClick={onCheckin}>
          <Icon icon={QrCode} size={26} />
          <span>
            <strong>Scanner une invitation</strong>
            <em>Check-in à l’entrée</em>
          </span>
        </button>

        <button type="button" className="hostess-home-card" onClick={onTables}>
          <Icon icon={UtensilsCrossed} size={24} />
          <span>
            <strong>Tables &amp; bar</strong>
            <em>Boissons par table</em>
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
