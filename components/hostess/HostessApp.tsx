"use client";

import { Footprints, House, LogOut, QrCode, UtensilsCrossed, Wine } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import CheckInView from "@/components/hostess/CheckInView";
import DrinkManagerView from "@/components/hostess/DrinkManagerView";
import HostessHome from "@/components/hostess/HostessHome";
import HostessPwa from "@/components/hostess/HostessPwa";
import ProtocolTablesView from "@/components/hostess/ProtocolTablesView";
import UsherView from "@/components/hostess/UsherView";
import type { HostessDrink, HostessTable } from "@/components/hostess/TablesDrinksView";
import { Icon } from "@/components/ui/Icon";

type Tab = "home" | "entry" | "usher" | "tables" | "bar";

type Props = {
  role: "admin" | "hostess";
  initialToken?: string;
};

export default function HostessApp({ role, initialToken }: Props) {
  const [tab, setTab] = useState<Tab>(initialToken ? "entry" : "home");
  const [tables, setTables] = useState<HostessTable[]>([]);
  const [drinks, setDrinks] = useState<HostessDrink[]>([]);
  const [stats, setStats] = useState({ tables: 0, checkedInGuests: 0, arrivedPeople: 0 });
  const [waitingGuides, setWaitingGuides] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);

  const loadTables = async () => {
    try {
      const res = await fetch("/api/hostess/tables");
      const data = await res.json();
      if (!data.success) return;
      setTables(data.tables);
      setDrinks(data.drinks);
      setStats(data.stats);
    } catch {
      /* keep last good state */
    }
  };

  const loadBadges = async () => {
    try {
      const [calls, orders] = await Promise.all([fetch("/api/hostess/usher-calls"), fetch("/api/hostess/orders")]);
      const callData = await calls.json();
      const orderData = await orders.json();
      if (callData.success) setWaitingGuides(callData.waitingCount || 0);
      if (orderData.success) setPendingOrders(orderData.pendingCount || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.body.classList.add("hostess-page");
    loadTables();
    loadBadges();
    const id = window.setInterval(() => {
      loadTables();
      loadBadges();
    }, 8000);
    return () => {
      document.body.classList.remove("hostess-page");
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className={`hostess-app${tab === "entry" ? " is-checkin" : ""}`}>
      <HostessPwa />
      {tab !== "entry" && (
        <header className="hostess-header">
          <div>
            <p className="hostess-kicker">Jennifer &amp; Herman</p>
            <h1>Protocole</h1>
          </div>
          <div className="hostess-header-actions">
            {role === "admin" && (
              <a href="/admin" className="hostess-signout">
                Admin
              </a>
            )}
            <button type="button" className="hostess-signout" onClick={() => signOut({ callbackUrl: "/hostess/login" })}>
              <Icon icon={LogOut} size={16} />
              Quitter
            </button>
          </div>
        </header>
      )}

      <main className="hostess-main">
        {tab === "home" && (
          <HostessHome
            stats={stats}
            tables={tables}
            waitingGuides={waitingGuides}
            pendingOrders={pendingOrders}
            onOpen={setTab}
          />
        )}
        {tab === "entry" && (
          <CheckInView initialToken={initialToken} onCheckinChange={loadTables} />
        )}
        {tab === "usher" && <UsherView />}
        {tab === "tables" && (
          <ProtocolTablesView tables={tables} drinks={drinks} />
        )}
        {tab === "bar" && <DrinkManagerView />}
      </main>

      <nav className="hostess-nav hostess-nav-5" aria-label="Navigation protocole">
        <button type="button" className={tab === "home" ? "is-active" : ""} onClick={() => setTab("home")}>
          <Icon icon={House} size={20} />
          Accueil
        </button>
        <button type="button" className={tab === "entry" ? "is-active" : ""} onClick={() => setTab("entry")}>
          <Icon icon={QrCode} size={20} />
          Entrée
        </button>
        <button type="button" className={tab === "usher" ? "is-active" : ""} onClick={() => setTab("usher")}>
          <Icon icon={Footprints} size={20} />
          Guide{waitingGuides ? ` ${waitingGuides}` : ""}
        </button>
        <button type="button" className={tab === "tables" ? "is-active" : ""} onClick={() => setTab("tables")}>
          <Icon icon={UtensilsCrossed} size={20} />
          Tables
        </button>
        <button type="button" className={tab === "bar" ? "is-active" : ""} onClick={() => setTab("bar")}>
          <Icon icon={Wine} size={20} />
          Bar{pendingOrders ? ` ${pendingOrders}` : ""}
        </button>
      </nav>
    </div>
  );
}
