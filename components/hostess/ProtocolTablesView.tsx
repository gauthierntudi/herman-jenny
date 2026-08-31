"use client";

import { Check, Loader2, Minus, Plus, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import GuestAvatar from "@/components/admin/GuestAvatar";
import { Icon } from "@/components/ui/Icon";
import { getSessionTableIds, setSessionTableIds } from "@/lib/protocol-session";
import type { HostessDrink, HostessTable } from "@/components/hostess/TablesDrinksView";

type Props = {
  tables: HostessTable[];
  drinks: HostessDrink[];
};

export default function ProtocolTablesView({ tables, drinks }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");

  useEffect(() => {
    const saved = getSessionTableIds();
    setSelectedIds(saved);
    setPicking(saved.length === 0);
  }, []);

  const myTables = useMemo(
    () => tables.filter((t) => selectedIds.includes(t.id)),
    [tables, selectedIds]
  );

  const toggleTable = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveSelection = () => {
    setSessionTableIds(selectedIds);
    setPicking(selectedIds.length === 0);
  };

  const keyFor = (tableId: string, drinkId: string) => `${tableId}:${drinkId}`;

  const sendOrder = async (table: HostessTable) => {
    const items = drinks
      .map((drink) => ({
        drinkId: drink.id,
        quantity: qty[keyFor(table.id, drink.id)] || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setSent("Choisissez au moins une boisson.");
      return;
    }

    setSending(true);
    setSent("");
    try {
      const res = await fetch("/api/hostess/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: table.id, items }),
      });
      const data = await res.json();
      if (!data.success) {
        setSent(data.message || "Envoi impossible.");
        return;
      }
      setQty((prev) => {
        const next = { ...prev };
        drinks.forEach((drink) => {
          delete next[keyFor(table.id, drink.id)];
        });
        return next;
      });
      setSent(`Commande envoyée au bar — ${table.name}`);
      navigator.vibrate?.(40);
    } catch {
      setSent("Connexion impossible.");
    } finally {
      setSending(false);
    }
  };

  if (picking) {
    return (
      <div className="hostess-picker">
        <h2>Tables de votre session</h2>
        <p>Cochez uniquement les tables que vous gérez ce soir.</p>
        <ul>
          {tables.map((table) => {
            const on = selectedIds.includes(table.id);
            return (
              <li key={table.id}>
                <button type="button" className={on ? "is-on" : ""} onClick={() => toggleTable(table.id)}>
                  <span>
                    <strong>{table.name}</strong>
                    <em>
                      {table.arrived}/{table.expected} arrivés
                    </em>
                  </span>
                  {on ? <Icon icon={Check} size={18} /> : <i />}
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="hostess-btn hostess-btn-gold" disabled={selectedIds.length === 0} onClick={saveSelection}>
          Continuer ({selectedIds.length})
        </button>
      </div>
    );
  }

  if (myTables.length === 0) {
    return (
      <div className="hostess-picker">
        <p>Aucune table sélectionnée pour cette session.</p>
        <button type="button" className="hostess-btn hostess-btn-gold" onClick={() => setPicking(true)}>
          Choisir mes tables
        </button>
      </div>
    );
  }

  return (
    <div className="hostess-protocol">
      <button type="button" className="hostess-edit-tables" onClick={() => setPicking(true)}>
        <Icon icon={Settings2} size={16} />
        Modifier mes tables ({myTables.length})
      </button>
      {sent && <p className="hostess-status">{sent}</p>}

      <ul className="hostess-table-list">
        {myTables.map((table) => {
          const open = openId === table.id;
          return (
            <li key={table.id} className={`hostess-table${open ? " is-open" : ""}`}>
              <button type="button" className="hostess-table-head" onClick={() => setOpenId(open ? null : table.id)}>
                <span>
                  <strong>{table.name}</strong>
                  <em>
                    {table.arrived}/{table.expected} arrivés
                  </em>
                </span>
              </button>
              {open && (
                <div className="hostess-table-body">
                  <div className="hostess-drinks">
                    {drinks.map((drink) => {
                      const key = keyFor(table.id, drink.id);
                      const count = qty[key] || 0;
                      return (
                        <div key={drink.id} className="hostess-drink">
                          <div>
                            <strong>{drink.name}</strong>
                            <em>{drink.unit}</em>
                          </div>
                          <div className="hostess-stepper">
                            <button
                              type="button"
                              disabled={count <= 0}
                              onClick={() => setQty((prev) => ({ ...prev, [key]: Math.max(0, count - 1) }))}
                            >
                              <Icon icon={Minus} size={16} />
                            </button>
                            <span>{count}</span>
                            <button
                              type="button"
                              onClick={() => setQty((prev) => ({ ...prev, [key]: count + 1 }))}
                            >
                              <Icon icon={Plus} size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="hostess-btn hostess-btn-gold"
                    disabled={sending}
                    onClick={() => sendOrder(table)}
                  >
                    {sending ? <Icon icon={Loader2} spin size={18} /> : "Envoyer au bar"}
                  </button>
                  <ul className="hostess-table-guests">
                    {table.guests.map((guest) => (
                      <li key={guest.id}>
                        <GuestAvatar name={guest.name} size={32} />
                        <span>
                          {guest.name}
                          <em>{guest.peopleCount} pers.</em>
                        </span>
                        <b className={guest.checkedInAt ? "is-in" : ""}>{guest.checkedInAt ? "Arrivé" : "Attendu"}</b>
                      </li>
                    ))}
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
