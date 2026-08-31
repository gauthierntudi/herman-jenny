"use client";

import { House, LogOut, QrCode, UtensilsCrossed } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import CheckInView from "@/components/hostess/CheckInView";
import HostessHome from "@/components/hostess/HostessHome";
import HostessPwa from "@/components/hostess/HostessPwa";
import TablesDrinksView, {
  type HostessDrink,
  type HostessTable,
} from "@/components/hostess/TablesDrinksView";
import { Icon } from "@/components/ui/Icon";

type Tab = "home" | "checkin" | "tables";

type Props = {
  role: "admin" | "hostess";
  initialToken?: string;
};

export default function HostessApp({ role, initialToken }: Props) {
  const [tab, setTab] = useState<Tab>(initialToken ? "checkin" : "home");
  const [tables, setTables] = useState<HostessTable[]>([]);
  const [drinks, setDrinks] = useState<HostessDrink[]>([]);
  const [stats, setStats] = useState({ tables: 0, checkedInGuests: 0, arrivedPeople: 0 });
  const [focusTableId, setFocusTableId] = useState<string | null>(null);

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

  useEffect(() => {
    document.body.classList.add("hostess-page");
    loadTables();
    const id = window.setInterval(loadTables, 20000);
    return () => {
      document.body.classList.remove("hostess-page");
      window.clearInterval(id);
    };
  }, []);

  const openTable = (tableId: string) => {
    setFocusTableId(tableId);
    setTab("tables");
    loadTables();
  };

  return (
    <div className={`hostess-app${tab === "checkin" ? " is-checkin" : ""}`}>
      <HostessPwa />
      {tab !== "checkin" && (
        <header className="hostess-header">
          <div>
            <p className="hostess-kicker">Jennifer &amp; Herman</p>
            <h1>Hôtesses</h1>
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
            onCheckin={() => setTab("checkin")}
            onTables={() => {
              setTab("tables");
              loadTables();
            }}
          />
        )}
        {tab === "checkin" && (
          <CheckInView initialToken={initialToken} onServeTable={openTable} onCheckinChange={loadTables} />
        )}
        {tab === "tables" && (
          <TablesDrinksView
            tables={tables}
            drinks={drinks}
            focusTableId={focusTableId}
            onTablesChange={setTables}
          />
        )}
      </main>

      <nav className="hostess-nav" aria-label="Navigation hôtesses">
        <button type="button" className={tab === "home" ? "is-active" : ""} onClick={() => setTab("home")}>
          <Icon icon={House} size={22} />
          Accueil
        </button>
        <button type="button" className={tab === "checkin" ? "is-active" : ""} onClick={() => setTab("checkin")}>
          <Icon icon={QrCode} size={22} />
          Check-in
        </button>
        <button
          type="button"
          className={tab === "tables" ? "is-active" : ""}
          onClick={() => {
            setTab("tables");
            loadTables();
          }}
        >
          <Icon icon={UtensilsCrossed} size={22} />
          Tables
        </button>
      </nav>
    </div>
  );
}
