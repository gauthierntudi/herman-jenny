"use client";

import { Guest, GuestStatus } from "@prisma/client";
import {
  Ban,
  Check,
  CheckCheck,
  Clock,
  Info,
  ListChecks,
  Loader2,
  LogOut,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Send,
  Smartphone,
  Trash2,
  Unlock,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminPagination from "@/components/admin/AdminPagination";
import { useConfirmDialog } from "@/components/admin/useConfirmDialog";
import GuestStats from "@/components/admin/GuestStats";
import InvitationsTab from "@/components/admin/InvitationsTab";
import TablesTab, { WeddingTableWithGuests } from "@/components/admin/TablesTab";
import GuestAvatar from "@/components/admin/GuestAvatar";
import { Icon } from "@/components/ui/Icon";
import { assertSuccess, toastError, toastPromise } from "@/lib/admin-toast";
import { isValidE164, normalizePhone } from "@/lib/phone";
import { sumPeopleCount } from "@/lib/people-count";

type Tab = "guests" | "whatsapp" | "tables" | "invitations";

type Props = {
  guests: Guest[];
  initialTables: WeddingTableWithGuests[];
  initialTab: Tab;
};

const PAGE_SIZES = [25, 50, 100] as const;

async function postAdmin(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

async function postGuests(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/guests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

function computeStats(guests: Guest[]) {
  const peopleFor = (filter: (g: Guest) => boolean) => sumPeopleCount(guests.filter(filter));

  return {
    totalPeople: sumPeopleCount(guests),
    totalRecords: guests.length,
    activePeople: peopleFor((g) => g.status === GuestStatus.ACTIVE),
    inactivePeople: peopleFor((g) => g.status !== GuestStatus.ACTIVE),
    awaitingPeople: peopleFor((g) => g.availability === true || g.availability === null),
    availablePeople: peopleFor((g) => g.availability === true),
    notAnsweredPeople: peopleFor((g) => g.availability === null),
    unavailablePeople: peopleFor((g) => g.availability === false),
    sent: guests.filter((g) => g.statusSend).length,
    notSent: guests.filter((g) => !g.statusSend).length,
    linked: guests.filter((g) => g.deviceId).length,
    outsideUsa: guests.filter((g) => g.outsideUsa === true).length,
  };
}

export default function AdminDashboard({ guests: initialGuests, initialTables, initialTab }: Props) {
  const [guests, setGuests] = useState(initialGuests);
  const [tables, setTables] = useState(initialTables);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [waRecipients, setWaRecipients] = useState([{ name: "", phone: "" }]);
  const [waSummary, setWaSummary] = useState("");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGenre, setEditGenre] = useState("Cher");
  const [savingGuest, setSavingGuest] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    document.body.classList.add("admin-dashboard-page");
    return () => document.body.classList.remove("admin-dashboard-page");
  }, []);

  const selectTab = (next: Tab) => {
    setTab(next);
    const url =
      next === "guests" ? "/admin" : next === "whatsapp" ? "/admin?tab=whatsapp" : `/admin?tab=${next}`;
    window.history.replaceState(window.history.state, "", url);
  };

  const handleGuestUpdated = (guest: Guest, previousPhone?: string) => {
    setGuests((prev) => prev.map((g) => (g.id === guest.id ? guest : g)));
    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        assignments: t.assignments.map((a) => (a.guestId === guest.id ? { ...a, guest } : a)),
      }))
    );
    if (previousPhone && previousPhone !== guest.phone) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(previousPhone)) {
          next.delete(previousPhone);
          next.add(guest.phone);
        }
        return next;
      });
    }
  };

  const handleInvitationSent = (guestId: string) => {
    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        assignments: t.assignments.map((a) =>
          a.guestId === guestId ? { ...a, invitationSent: true } : a
        ),
      }))
    );
  };

  const handleInvitationsSent = (guestIds: string[]) => {
    const ids = new Set(guestIds);
    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        assignments: t.assignments.map((a) =>
          ids.has(a.guestId) ? { ...a, invitationSent: true } : a
        ),
      }))
    );
  };

  const stats = useMemo(() => computeStats(guests), [guests]);

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.token.toLowerCase().includes(q)
    );
  }, [guests, search]);

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [filteredGuests, currentPage, pageSize]);

  const rangeStart = filteredGuests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredGuests.length);

  const allSelected = paginatedGuests.length > 0 && paginatedGuests.every((g) => selected.has(g.phone));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) {
      paginatedGuests.forEach((g) => next.delete(g.phone));
    } else {
      paginatedGuests.forEach((g) => next.add(g.phone));
    }
    setSelected(next);
  };

  const updateGuest = (phone: string, patch: Partial<Guest>) => {
    setGuests((prev) => prev.map((g) => (g.phone === phone ? { ...g, ...patch } : g)));
  };

  const openEditGuestModal = (guest: Guest) => {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditPhone(guest.phone);
    setEditGenre(guest.genre || "Cher");
  };

  const closeEditGuestModal = () => {
    if (savingGuest) return;
    setEditingGuest(null);
    setEditName("");
    setEditPhone("");
    setEditGenre("Cher");
  };

  const saveGuest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGuest) return;

    const name = editName.trim();
    const genre = editGenre.trim();
    const phone = normalizePhone(editPhone.trim());

    if (name.length < 2) {
      toastError("Le nom doit contenir au moins 2 caractères.");
      return;
    }

    if (!isValidE164(phone)) {
      toastError("Numéro invalide. Utilisez le format international (ex. +33612345678).");
      return;
    }

    const previousPhone = editingGuest.phone;
    setSavingGuest(true);
    try {
      const data = await toastPromise(
        postGuests("update_guest", { guestId: editingGuest.id, name, phone, genre }).then(assertSuccess),
        {
          pending: "Mise à jour de l'invité…",
          success: "Invité mis à jour",
        }
      );
      handleGuestUpdated(data.guest, previousPhone);
      setEditingGuest(null);
      setEditName("");
      setEditPhone("");
      setEditGenre("Cher");
    } catch {
      /* toast affiché */
    } finally {
      setSavingGuest(false);
    }
  };

  const sendOne = async (guest: Guest) => {
    const ok = await confirm({
      title: "Envoyer WhatsApp",
      message: `Envoyer l'invitation à ${guest.name} ?`,
      confirmLabel: "Envoyer",
      variant: "whatsapp",
      icon: MessageCircle,
    });
    if (!ok) return;

    try {
      await toastPromise(
        postAdmin("send_whatsapp", {
          phone: guest.phone,
          name: guest.name,
          token: guest.token,
          genre: guest.genre,
        }).then(assertSuccess),
        {
          pending: `Envoi à ${guest.name}…`,
          success: `Invitation envoyée à ${guest.name}`,
        }
      );
      updateGuest(guest.phone, { statusSend: true });
    } catch {
      /* toast affiché */
    }
  };

  const toggleBlocked = async (guest: Guest) => {
    const blocked = !guest.sendBlocked;
    try {
      const data = await toastPromise(
        postAdmin("toggle_uncertain", { phone: guest.phone, blocked }).then(assertSuccess),
        {
          pending: "Mise à jour…",
          success: blocked ? "Invité marqué incertain" : "Invité réactivé",
        }
      );
      updateGuest(guest.phone, { sendBlocked: blocked });
    } catch {
      /* toast affiché */
    }
  };

  const sendSelected = async () => {
    const rows = guests.filter((g) => selected.has(g.phone) && !g.sendBlocked && !g.statusSend);
    if (!rows.length) {
      toastError("Aucun invité éligible sélectionné.");
      return;
    }

    const ok = await confirm({
      title: "Envoi groupé WhatsApp",
      message: `Envoyer l'invitation à ${rows.length} invité(s) ?`,
      detail: "Les messages seront envoyés un par un via Twilio.",
      confirmLabel: `Envoyer (${rows.length})`,
      variant: "whatsapp",
      icon: MessageCircle,
    });
    if (!ok) return;

    setBulkStatus(`Envoi en cours (${rows.length})…`);
    try {
      const data = await toastPromise(
        postAdmin("send_whatsapp_bulk", {
          recipients: rows.map((g) => ({ phone: g.phone, name: g.name, token: g.token, genre: g.genre })),
        }).then(assertSuccess),
        {
          pending: `Envoi à ${rows.length} invité(s)…`,
          success: `${rows.length} invitation(s) traitée(s)`,
        }
      );
      data.results?.forEach((r: { phone: string; success: boolean }) => {
        if (r.success) updateGuest(r.phone, { statusSend: true });
      });
      setBulkStatus(`${data.sent} / ${data.total} envoyés.`);
      setSelected(new Set());
    } catch {
      setBulkStatus("");
    }
  };

  const sendCustom = async () => {
    const recipients = waRecipients.filter((r) => r.name.trim() && r.phone.trim());
    if (!recipients.length) {
      toastError("Ajoutez au moins un destinataire.");
      return;
    }
    try {
      const data = await toastPromise(
        postAdmin("send_whatsapp_custom", { recipients }).then(assertSuccess),
        {
          pending: `Envoi à ${recipients.length} destinataire(s)…`,
          success: `${recipients.length} message(s) traité(s)`,
        }
      );
      setWaSummary(`${data.sent} / ${data.total} envoyés.`);
    } catch {
      /* toast affiché */
    }
  };

  const markOneAsSent = async (guest: Guest) => {
    if (guest.statusSend) return;

    const ok = await confirm({
      title: "Marquer comme envoyé",
      message: `Marquer ${guest.name} comme « envoyé » ?`,
      detail: "Aucun message WhatsApp ne sera envoyé. Seul le statut sera mis à jour.",
      confirmLabel: "Marquer envoyé",
      variant: "success",
      icon: CheckCheck,
    });
    if (!ok) return;

    try {
      await toastPromise(
        postGuests("mark_sent", { phones: [guest.phone] }).then(assertSuccess),
        {
          pending: "Mise à jour…",
          success: `${guest.name} marqué comme envoyé`,
        }
      );
      updateGuest(guest.phone, { statusSend: true });
    } catch {
      /* toast affiché */
    }
  };

  const markSelectedAsSent = async () => {
    const phones = Array.from(selected);
    if (!phones.length) {
      toastError("Sélectionnez au moins un invité.");
      return;
    }

    const ok = await confirm({
      title: "Marquer la sélection",
      message: `Marquer ${phones.length} invité(s) comme « envoyé » ?`,
      detail: "Aucun message WhatsApp ne sera envoyé. Seuls les statuts seront mis à jour.",
      confirmLabel: `Marquer (${phones.length})`,
      variant: "success",
      icon: CheckCheck,
    });
    if (!ok) return;

    setBulkStatus(`Mise à jour (${phones.length})…`);
    try {
      const data = await toastPromise(
        postGuests("mark_sent", { phones }).then(assertSuccess),
        {
          pending: `Mise à jour de ${phones.length} invité(s)…`,
          success: `${phones.length} invité(s) marqué(s) comme envoyé`,
        }
      );
      phones.forEach((phone) => updateGuest(phone, { statusSend: true }));
      setBulkStatus(`${data.updated} invité(s) marqué(s) comme envoyé.`);
    } catch {
      setBulkStatus("");
    }
  };

  const markAllAsSent = async () => {
    if (stats.notSent === 0) {
      toastError("Tous les invités sont déjà marqués comme envoyés.");
      return;
    }

    const ok = await confirm({
      title: "Tout marquer comme envoyé",
      message: `Marquer les ${stats.notSent} invité(s) restant(s) comme « envoyé » ?`,
      detail:
        "Aucun message WhatsApp ne sera envoyé. Utile si les invitations ont déjà été envoyées manuellement ou via un autre outil.",
      confirmLabel: `Marquer tout (${stats.notSent})`,
      variant: "success",
      icon: ListChecks,
    });
    if (!ok) return;

    setBulkStatus("Mise à jour en cours…");
    try {
      const data = await toastPromise(
        postGuests("mark_sent", { all: true }).then(assertSuccess),
        {
          pending: "Mise à jour de tous les invités…",
          success: "Tous les invités marqués comme envoyés",
        }
      );
      setGuests((prev) => prev.map((g) => ({ ...g, statusSend: true })));
      setBulkStatus(`${data.updated} invité(s) marqué(s) comme envoyé.`);
    } catch {
      setBulkStatus("");
    }
  };

  const pageTitle =
    tab === "guests"
      ? "Invités"
      : tab === "whatsapp"
        ? "WhatsApp"
        : tab === "invitations"
          ? "Invitations"
          : "Tables";
  const pageSubtitle =
    tab === "guests"
      ? `${stats.totalPeople} invités · ${stats.activePeople} actifs · ${stats.sent} messages envoyés`
      : tab === "whatsapp"
        ? "Envoi manuel de messages template"
        : tab === "invitations"
          ? "Invitations WhatsApp pour les invités assignés à une table"
          : "Plan de table et assignation des invités";

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src="/img/logo.png" alt="H & J" />
          <h2>Kande&apos;s Wedding</h2>
          <span>Administration</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item${tab === "guests" ? " active" : ""}`}
            onClick={() => selectTab("guests")}
          >
            <Icon icon={Users} size={18} />
            Invités
          </button>
          <button
            type="button"
            className={`admin-nav-item${tab === "whatsapp" ? " active" : ""}`}
            onClick={() => selectTab("whatsapp")}
          >
            <Icon icon={MessageCircle} size={18} className="lucide-icon-wa" />
            WhatsApp
          </button>
          <button
            type="button"
            className={`admin-nav-item${tab === "tables" ? " active" : ""}`}
            onClick={() => selectTab("tables")}
          >
            <Icon icon={UtensilsCrossed} size={18} />
            Tables
          </button>
          <button
            type="button"
            className={`admin-nav-item${tab === "invitations" ? " active" : ""}`}
            onClick={() => selectTab("invitations")}
          >
            <Icon icon={MessageSquareText} size={18} />
            Invitations
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-logout-btn"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
          >
            <Icon icon={LogOut} size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          {tab === "guests" && selected.size > 0 && (
            <button type="button" className="admin-btn admin-btn-success" onClick={sendSelected}>
              <Icon icon={MessageCircle} size={18} className="lucide-icon-wa" />
              Envoyer ({selected.size})
            </button>
          )}
        </header>

        <div className="admin-content">
          {tab === "guests" && (
            <>
              <GuestStats stats={stats} />

              <div className="admin-info-banner">
                <Icon icon={Info} size={18} />
                <div>
                  Template Twilio : variable <code>{`{{1}}`}</code> = prénom de l&apos;invité.
                  Lien RSVP :{" "}
                  <a href="https://jennifer-herman.com/savethedate" target="_blank" rel="noopener noreferrer">
                    jennifer-herman.com/savethedate
                  </a>
                </div>
              </div>

              <div className="admin-panel">
                <div className="admin-panel-header">
                  <div className="admin-toolbar" style={{ flex: 1 }}>
                    <div className="admin-search">
                      <Icon icon={Search} size={15} />
                      <input
                        type="search"
                        placeholder="Rechercher par nom, téléphone, token…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-success"
                      onClick={sendSelected}
                      disabled={selected.size === 0}
                    >
                      <Icon icon={MessageCircle} size={16} className="lucide-icon-wa" />
                      Envoyer la sélection
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={markSelectedAsSent}
                      disabled={selected.size === 0}
                      title="Marquer comme envoyé sans envoyer de message"
                    >
                      <Icon icon={CheckCheck} size={16} />
                      Marquer sélection
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={markAllAsSent}
                      disabled={stats.notSent === 0}
                      title="Marquer tous les invités non envoyés"
                    >
                      <Icon icon={ListChecks} size={16} />
                      Tout marquer envoyé
                    </button>
                    {bulkStatus && <span className="admin-status-text">{bulkStatus}</span>}
                  </div>
                </div>

                <div className="admin-panel-body flush">
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th className="col-check">
                            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                          </th>
                          <th>Invité</th>
                          <th>Téléphone</th>
                          <th>Token</th>
                          <th>Statut</th>
                          <th>Disponibilité</th>
                          <th>International</th>
                          <th>Besoins</th>
                          <th>WhatsApp</th>
                          <th>Appareil</th>
                          <th className="col-actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGuests.length === 0 ? (
                          <tr>
                            <td colSpan={11} style={{ textAlign: "center", padding: "40px 16px" }}>
                              <span className="admin-empty">Aucun invité trouvé</span>
                            </td>
                          </tr>
                        ) : (
                          paginatedGuests.map((guest) => {
                            const outside = guest.outsideUsa === true;
                            const disabledSend = guest.statusSend || guest.sendBlocked;
                            return (
                              <tr key={guest.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selected.has(guest.phone)}
                                    onChange={(e) => {
                                      const next = new Set(selected);
                                      if (e.target.checked) next.add(guest.phone);
                                      else next.delete(guest.phone);
                                      setSelected(next);
                                    }}
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="admin-guest-cell admin-guest-cell-btn"
                                    onClick={() => openEditGuestModal(guest)}
                                    title="Modifier l'invité"
                                  >
                                    <GuestAvatar name={guest.name} size={36} />
                                    <span className="admin-guest-name">{guest.name}</span>
                                  </button>
                                </td>
                                <td className="admin-mono">{guest.phone}</td>
                                <td><span className="admin-token">{guest.token}</span></td>
                                <td>
                                  {guest.status === GuestStatus.ACTIVE ? (
                                    <span className="admin-badge admin-badge-success">
                                      <Icon icon={Check} size={12} /> Actif
                                    </span>
                                  ) : (
                                    <span className="admin-badge admin-badge-warning">
                                      <Icon icon={Clock} size={12} /> En attente
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {guest.availability === true && (
                                    <span className="admin-badge admin-badge-success">Disponible</span>
                                  )}
                                  {guest.availability === false && (
                                    <span className="admin-badge admin-badge-danger">Indisponible</span>
                                  )}
                                  {guest.availability === null && (
                                    <span className="admin-badge admin-badge-neutral">Non répondu</span>
                                  )}
                                </td>
                                <td>
                                  {outside ? (
                                    <div className="admin-badges-wrap">
                                      <span className="admin-badge admin-badge-warning">Hors USA</span>
                                      {guest.peopleCount != null && (
                                        <span className="admin-badge admin-badge-outline">{guest.peopleCount} pers.</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="admin-empty">—</span>
                                  )}
                                </td>
                                <td>
                                  {outside ? (
                                    <div className="admin-badges-wrap">
                                      {guest.needInvitation && <span className="admin-badge admin-badge-outline">Invitation</span>}
                                      {guest.needVisaAssistance && <span className="admin-badge admin-badge-outline">Visa</span>}
                                      {guest.needHotelBooking && <span className="admin-badge admin-badge-outline">Hôtel</span>}
                                      {!guest.needInvitation && !guest.needVisaAssistance && !guest.needHotelBooking && (
                                        <span className="admin-empty">—</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="admin-empty">—</span>
                                  )}
                                </td>
                                <td>
                                  {guest.statusSend ? (
                                    <span className="admin-badge admin-badge-success">
                                      <Icon icon={Send} size={12} /> Envoyé
                                    </span>
                                  ) : (
                                    <span className="admin-badge admin-badge-neutral">Non envoyé</span>
                                  )}
                                </td>
                                <td>
                                  {guest.deviceId ? (
                                    <span className="admin-badge admin-badge-info">
                                      <Icon icon={Smartphone} size={12} /> Lié
                                    </span>
                                  ) : (
                                    <span className="admin-empty">—</span>
                                  )}
                                </td>
                                <td className="col-actions">
                                  <button
                                    type="button"
                                    className="admin-icon-btn"
                                    onClick={() => openEditGuestModal(guest)}
                                    title="Modifier l'invité"
                                  >
                                    <Icon icon={Pencil} size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-icon-btn wa"
                                    disabled={disabledSend}
                                    onClick={() => sendOne(guest)}
                                    title={guest.sendBlocked ? "Envoi désactivé" : guest.statusSend ? "Déjà envoyé" : "Envoyer WhatsApp"}
                                  >
                                    <Icon icon={MessageCircle} size={16} className="lucide-icon-wa" />
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-icon-btn"
                                    disabled={guest.statusSend}
                                    onClick={() => markOneAsSent(guest)}
                                    title="Marquer comme envoyé (sans envoi)"
                                  >
                                    <Icon icon={CheckCheck} size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-icon-btn"
                                    onClick={() => toggleBlocked(guest)}
                                    title={guest.sendBlocked ? "Réactiver l'envoi" : "Désactiver l'envoi"}
                                  >
                                    <Icon icon={guest.sendBlocked ? Unlock : Ban} size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredGuests.length > 0 && (
                    <AdminPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      rangeStart={rangeStart}
                      rangeEnd={rangeEnd}
                      totalItems={filteredGuests.length}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {tab === "whatsapp" && (
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Envoi WhatsApp manuel</h3>
                  <p>Envoyer le template à un ou plusieurs destinataires personnalisés.</p>
                </div>
              </div>
              <div className="admin-panel-body">
                <table className="admin-form-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Numéro WhatsApp (E.164)</th>
                      <th style={{ width: 60 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {waRecipients.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            className="admin-input"
                            value={r.name}
                            onChange={(e) => {
                              const next = [...waRecipients];
                              next[i] = { ...next[i], name: e.target.value };
                              setWaRecipients(next);
                            }}
                            placeholder="Nom"
                          />
                        </td>
                        <td>
                          <input
                            className="admin-input"
                            value={r.phone}
                            onChange={(e) => {
                              const next = [...waRecipients];
                              next[i] = { ...next[i], phone: e.target.value };
                              setWaRecipients(next);
                            }}
                            placeholder="+15551234567"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-icon-btn admin-btn-danger"
                            onClick={() => setWaRecipients(waRecipients.filter((_, j) => j !== i))}
                            disabled={waRecipients.length === 1}
                          >
                            <Icon icon={Trash2} size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="admin-toolbar" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setWaRecipients([...waRecipients, { name: "", phone: "" }])}
                  >
                    <Icon icon={Plus} size={16} />
                    Ajouter un destinataire
                  </button>
                  <button type="button" className="admin-btn admin-btn-success" style={{ marginLeft: "auto" }} onClick={sendCustom}>
                    <Icon icon={MessageCircle} size={16} className="lucide-icon-wa" />
                    Envoyer
                  </button>
                </div>
                {waSummary && <p className="admin-status-text" style={{ marginTop: 16, marginLeft: 0 }}>{waSummary}</p>}
              </div>
            </div>
          )}

          {tab === "tables" && (
            <TablesTab
              guests={guests}
              tables={tables}
              setTables={setTables}
              onGuestAdded={(guest) => setGuests((prev) => [...prev, guest].sort((a, b) => a.name.localeCompare(b.name)))}
              onGuestUpdated={handleGuestUpdated}
            />
          )}

          {tab === "invitations" && (
            <InvitationsTab
              tables={tables}
              onInvitationSent={handleInvitationSent}
              onInvitationsSent={handleInvitationsSent}
            />
          )}
        </div>
      </div>
      {editingGuest && (
        <div className="admin-modal-overlay" onClick={closeEditGuestModal} role="presentation">
          <div
            className="admin-modal admin-modal-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-guest-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-icon default">
              <Icon icon={Pencil} size={28} strokeWidth={1.75} aria-hidden />
            </div>
            <h2 id="edit-guest-title" className="admin-modal-title">
              Modifier l&apos;invité
            </h2>

            <form className="admin-modal-fields" onSubmit={saveGuest}>
              <div className="admin-form-field">
                <label htmlFor="edit-guest-phone">Téléphone WhatsApp</label>
                <input
                  id="edit-guest-phone"
                  className="admin-input admin-mono"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+33612345678"
                  required
                  autoFocus
                  disabled={savingGuest}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-guest-genre">Genre</label>
                <select
                  id="edit-guest-genre"
                  className="admin-input admin-select"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  disabled={savingGuest}
                >
                  <option value="Cher">Cher</option>
                  <option value="Chère">Chère</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label htmlFor="edit-guest-name">Nom</label>
                <input
                  id="edit-guest-name"
                  className="admin-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nom de l'invité"
                  required
                  minLength={2}
                  disabled={savingGuest}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-btn cancel"
                  onClick={closeEditGuestModal}
                  disabled={savingGuest}
                >
                  Annuler
                </button>
                <button type="submit" className="admin-modal-btn confirm default" disabled={savingGuest}>
                  {savingGuest ? (
                    <>
                      <Icon icon={Loader2} spin size={18} />
                      Enregistrement…
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}
