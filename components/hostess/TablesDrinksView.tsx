"use client";

import { ChevronDown, Loader2, Minus, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import GuestAvatar from "@/components/admin/GuestAvatar";
import { Icon } from "@/components/ui/Icon";
import type { HostessGuest } from "@/lib/hostess";

export type HostessDrink = {
  id: string;
  slug: string;
  name: string;
  unit: string;
};

export type HostessTable = {
  id: string;
  name: string;
  seatCount: number;
  expected: number;
  arrived: number;
  guests: HostessGuest[];
  drinks: Record<string, number>;
};

type Props = {
  tables: HostessTable[];
  drinks: HostessDrink[];
  focusTableId?: string | null;
  onTablesChange: Dispatch<SetStateAction<HostessTable[]>>;
};

export default function TablesDrinksView({ tables, drinks, focusTableId, onTablesChange }: Props) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(focusTableId || tables[0]?.id || null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (focusTableId) setOpenId(focusTableId);
  }, [focusTableId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.guests.some((g) => g.name.toLowerCase().includes(q))
    );
  }, [tables, query]);

  const adjust = async (table: HostessTable, drink: HostessDrink, action: "serve" | "undo") => {
    const key = `${table.id}:${drink.id}`;
    if (pending) return;
    const current = table.drinks[drink.id] || 0;
    if (action === "undo" && current <= 0) return;

    const nextCount = action === "serve" ? current + 1 : Math.max(0, current - 1);
    onTablesChange((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, drinks: { ...t.drinks, [drink.id]: nextCount } } : t))
    );
    setPending(key);

    try {
      const res = await fetch("/api/hostess/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tableId: table.id, drinkId: drink.id }),
      });
      const data = await res.json();
      if (!data.success) {
        onTablesChange((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, drinks: { ...t.drinks, [drink.id]: current } } : t))
        );
        return;
      }
      onTablesChange((prev) =>
        prev.map((t) =>
          t.id === table.id ? { ...t, drinks: { ...t.drinks, [drink.id]: data.quantity } } : t
        )
      );
    } catch {
      onTablesChange((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, drinks: { ...t.drinks, [drink.id]: current } } : t))
      );
    } finally {
      setPending(null);
    }
  };

  if (tables.length === 0) {
    return <p className="hostess-empty">Aucune table n’a encore été créée.</p>;
  }

  return (
    <div className="hostess-tables">
      <form className="hostess-search" onSubmit={(e) => e.preventDefault()}>
        <Icon icon={Search} size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Table ou nom d’invité"
        />
      </form>

      <ul className="hostess-table-list">
        {filtered.map((table) => {
          const open = openId === table.id;
          const totalDrinks = Object.values(table.drinks).reduce((sum, n) => sum + n, 0);
          return (
            <li key={table.id} className={`hostess-table${open ? " is-open" : ""}`}>
              <button
                type="button"
                className="hostess-table-head"
                onClick={() => setOpenId(open ? null : table.id)}
                aria-expanded={open}
              >
                <span>
                  <strong>{table.name}</strong>
                  <em>
                    {table.arrived}/{table.expected} arrivés · {totalDrinks} boissons
                  </em>
                </span>
                <Icon icon={ChevronDown} size={18} />
              </button>

              {open && (
                <div className="hostess-table-body">
                  <div className="hostess-drinks">
                    {drinks.map((drink) => {
                      const count = table.drinks[drink.id] || 0;
                      const busy = pending === `${table.id}:${drink.id}`;
                      return (
                        <div key={drink.id} className="hostess-drink">
                          <div>
                            <strong>{drink.name}</strong>
                            <em>{drink.unit}</em>
                          </div>
                          <div className="hostess-stepper">
                            <button
                              type="button"
                              aria-label={`Retirer ${drink.name}`}
                              disabled={count <= 0 || busy}
                              onClick={() => adjust(table, drink, "undo")}
                            >
                              <Icon icon={Minus} size={16} />
                            </button>
                            <span>{busy ? <Icon icon={Loader2} spin size={16} /> : count}</span>
                            <button
                              type="button"
                              aria-label={`Servir ${drink.name}`}
                              disabled={busy}
                              onClick={() => adjust(table, drink, "serve")}
                            >
                              <Icon icon={Plus} size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <ul className="hostess-table-guests">
                    {table.guests.map((guest) => (
                      <li key={guest.id}>
                        <GuestAvatar name={guest.name} size={32} />
                        <span>
                          {guest.name}
                          <em>{guest.peopleCount} pers.</em>
                        </span>
                        <b className={guest.checkedInAt ? "is-in" : ""}>
                          {guest.checkedInAt ? "Arrivé" : "Attendu"}
                        </b>
                      </li>
                    ))}
                    {table.guests.length === 0 && <li className="hostess-muted">Aucun invité assigné</li>}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
