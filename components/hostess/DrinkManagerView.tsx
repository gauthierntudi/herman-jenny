"use client";

import { Bell, Check, Loader2, Plus, Wine } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { pingAlert } from "@/lib/announce";

type Order = {
  id: string;
  status: "PENDING" | "PREPARING" | "READY" | "PICKED_UP" | "CANCELLED";
  createdAt: string;
  table: { id: string; name: string };
  items: { id: string; quantity: number; drink: { id: string; name: string; unit: string } }[];
};

type Drink = {
  id: string;
  name: string;
  unit: string;
  active: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Nouvelle",
  PREPARING: "En préparation",
  READY: "Plateau prêt",
};

export default function DrinkManagerView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("verre");
  const [saving, setSaving] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogOk, setCatalogOk] = useState("");
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const load = async () => {
    const [orderRes, drinkRes] = await Promise.all([fetch("/api/hostess/orders"), fetch("/api/hostess/drinks?all=1")]);
    const orderData = await orderRes.json();
    const drinkData = await drinkRes.json();
    if (orderData.success) {
      const list = orderData.orders as Order[];
      if (primed.current) {
        const fresh = list.filter((o) => o.status === "PENDING" && !seen.current.has(o.id));
        if (fresh.length) pingAlert();
      }
      seen.current = new Set(list.map((o) => o.id));
      primed.current = true;
      setOrders(list);
    }
    if (drinkData.success) setDrinks(drinkData.drinks);
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 2500);
    return () => window.clearInterval(id);
  }, []);

  const act = async (orderId: string, action: "prepare" | "ready" | "pickup" | "cancel") => {
    const res = await fetch("/api/hostess/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action }),
    });
    const data = await res.json();
    if (data.success) load();
  };

  const addDrink = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setCatalogError("Indiquez le nom de la boisson.");
      setCatalogOk("");
      return;
    }

    setSaving(true);
    setCatalogError("");
    setCatalogOk("");
    try {
      const res = await fetch("/api/hostess/drinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: trimmed, unit: unit.trim() || "verre" }),
      });
      const data = await res.json();
      if (!data.success) {
        setCatalogError(data.message || "Impossible d’ajouter cette boisson.");
        return;
      }
      setName("");
      setUnit("verre");
      setCatalogOk(`${data.drink?.name || trimmed} est disponible pour les protocoles.`);
      await load();
    } catch {
      setCatalogError("Connexion impossible. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDrink = async (drink: Drink) => {
    setCatalogError("");
    const res = await fetch("/api/hostess/drinks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: drink.id, active: !drink.active }),
    });
    const data = await res.json();
    if (!data.success) {
      setCatalogError(data.message || "Mise à jour impossible.");
      return;
    }
    setCatalogOk(drink.active ? `${drink.name} retirée du service.` : `${drink.name} est de nouveau disponible.`);
    load();
  };

  return (
    <div className="hostess-bar">
      <section className="hostess-catalog-panel">
        <h2>
          <Icon icon={Wine} size={18} /> Boissons disponibles
        </h2>
        <p className="hostess-catalog-lead">
          Ajoutez ici ce que le bar sert ce soir. Seules les boissons actives s’affichent chez les protocoles aux tables.
        </p>
        <form className="hostess-catalog-form hostess-catalog-form-stack" onSubmit={addDrink}>
          <label>
            Nom de la boisson
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Jus de bissap"
              autoCapitalize="sentences"
              required
            />
          </label>
          <label>
            Unité
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="verre, flute…" />
          </label>
          <button type="submit" disabled={saving || name.trim().length < 2}>
            {saving ? <Icon icon={Loader2} spin size={18} /> : <Icon icon={Plus} size={18} />}
            Ajouter au catalogue
          </button>
        </form>
        {catalogError ? <p className="hostess-error">{catalogError}</p> : null}
        {catalogOk ? <p className="hostess-status">{catalogOk}</p> : null}
        {drinks.length === 0 ? (
          <p className="hostess-muted">Aucune boisson pour l’instant. Ajoutez la première ci-dessus.</p>
        ) : (
          <ul className="hostess-catalog">
            {drinks.map((drink) => (
              <li key={drink.id} className={drink.active ? "" : "is-off"}>
                <span>
                  <strong>{drink.name}</strong>
                  <em>{drink.unit}</em>
                </span>
                <button type="button" className={drink.active ? "is-on" : ""} onClick={() => toggleDrink(drink)}>
                  {drink.active ? <Icon icon={Check} size={14} /> : null}
                  {drink.active ? "Disponible" : "Masquée"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2>
        <Icon icon={Bell} size={18} /> Commandes
      </h2>
      {orders.length === 0 ? (
        <p className="hostess-muted">Aucune commande en cours.</p>
      ) : (
        <ul className="hostess-order-list">
          {orders.map((order) => (
            <li key={order.id} className={`hostess-order is-${order.status.toLowerCase()}`}>
              <header>
                <strong>{order.table.name}</strong>
                <em>{STATUS_LABEL[order.status] || order.status}</em>
              </header>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.drink.name}
                  </li>
                ))}
              </ul>
              <div className="hostess-order-actions">
                {order.status === "PENDING" && (
                  <button type="button" onClick={() => act(order.id, "prepare")}>
                    Préparer
                  </button>
                )}
                {(order.status === "PENDING" || order.status === "PREPARING") && (
                  <button type="button" className="is-gold" onClick={() => act(order.id, "ready")}>
                    Plateau prêt
                  </button>
                )}
                {order.status === "READY" && (
                  <button type="button" className="is-gold" onClick={() => act(order.id, "pickup")}>
                    Récupéré
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
