"use client";

import { Guest } from "@prisma/client";
import { CheckCheck, Info, Mail, MessageCircle, Search, Send, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminPagination from "@/components/admin/AdminPagination";
import { ColoredStatsGrid, type ColoredStatItem } from "@/components/admin/AdminColoredStats";
import GuestAvatar from "@/components/admin/GuestAvatar";
import { WeddingTableWithGuests } from "@/components/admin/TablesTab";
import { useConfirmDialog } from "@/components/admin/useConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { assertSuccess, toastPromise } from "@/lib/admin-toast";
import { getPeopleCount, sumPeopleCount } from "@/lib/people-count";

export type AssignedGuestRow = {
  guestId: string;
  guest: Guest;
  tableId: string;
  tableName: string;
  invitationSent: boolean;
};

type Props = {
  tables: WeddingTableWithGuests[];
  onInvitationSent: (guestId: string) => void;
  onInvitationsSent: (guestIds: string[]) => void;
};

async function postAdmin(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

async function postTables(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

function buildAssignedRows(tables: WeddingTableWithGuests[]): AssignedGuestRow[] {
  const rows: AssignedGuestRow[] = [];
  for (const table of tables) {
    for (const assignment of table.assignments) {
      rows.push({
        guestId: assignment.guestId,
        guest: assignment.guest,
        tableId: table.id,
        tableName: table.name,
        invitationSent: assignment.invitationSent,
      });
    }
  }
  return rows.sort((a, b) => a.guest.name.localeCompare(b.guest.name));
}

function isEligible(row: AssignedGuestRow) {
  return !row.invitationSent && !row.guest.sendBlocked;
}

export default function InvitationsTab({ tables, onInvitationSent, onInvitationsSent }: Props) {
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [bulkStatus, setBulkStatus] = useState("");
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const assignedRows = useMemo(() => buildAssignedRows(tables), [tables]);

  const tableOptions = useMemo(
    () => tables.filter((t) => t.assignments.length > 0).sort((a, b) => a.name.localeCompare(b.name)),
    [tables]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignedRows.filter((row) => {
      if (tableFilter && row.tableId !== tableFilter) return false;
      if (!q) return true;
      return (
        row.guest.name.toLowerCase().includes(q) ||
        row.guest.phone.includes(q) ||
        row.tableName.toLowerCase().includes(q)
      );
    });
  }, [assignedRows, search, tableFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, tableFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const rangeStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredRows.length);

  const allSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row) => selected.has(row.guest.phone) && isEligible(row));

  const assignedPeople = sumPeopleCount(assignedRows.map((r) => r.guest));
  const sentPeople = sumPeopleCount(assignedRows.filter((r) => r.invitationSent).map((r) => r.guest));
  const pendingPeople = sumPeopleCount(assignedRows.filter(isEligible).map((r) => r.guest));
  const sentProgress = assignedPeople > 0 ? Math.round((sentPeople / assignedPeople) * 100) : 0;

  const stats: ColoredStatItem[] = [
    {
      icon: UtensilsCrossed,
      tone: "purple",
      value: assignedPeople,
      label: "Invités assignés",
      sub: `${assignedRows.length} fiche${assignedRows.length > 1 ? "s" : ""} · ${tables.filter((t) => t.assignments.length > 0).length} table${tables.filter((t) => t.assignments.length > 0).length > 1 ? "s" : ""}`,
    },
    {
      icon: Send,
      tone: "green",
      value: sentPeople,
      label: "Invitations envoyées",
      sub: `${sentProgress}% des assignés`,
      progress: sentProgress,
    },
    {
      icon: Mail,
      tone: "gold",
      value: pendingPeople,
      label: "En attente d'envoi",
      sub: `${assignedRows.filter(isEligible).length} éligible${assignedRows.filter(isEligible).length > 1 ? "s" : ""}`,
    },
  ];

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) {
      paginatedRows.forEach((row) => next.delete(row.guest.phone));
    } else {
      paginatedRows.forEach((row) => {
        if (isEligible(row)) next.add(row.guest.phone);
      });
    }
    setSelected(next);
  };

  const sendOne = async (row: AssignedGuestRow) => {
    const ok = await confirm({
      title: "Envoyer l'invitation",
      message: `Envoyer l'invitation PDF (nom, QR) à ${row.guest.name} ?`,
      confirmLabel: "Envoyer",
      variant: "whatsapp",
      icon: MessageCircle,
    });
    if (!ok) return;

    try {
      await toastPromise(
        postAdmin("send_table_invitation", {
          guestId: row.guestId,
          phone: row.guest.phone,
          name: row.guest.name,
          token: row.guest.token,
          genre: row.guest.genre,
        }).then(assertSuccess),
        {
          pending: `Envoi à ${row.guest.name}…`,
          success: `Invitation envoyée à ${row.guest.name}`,
        }
      );
      onInvitationSent(row.guestId);
    } catch {
      /* toast affiché */
    }
  };

  const sendSelected = async () => {
    const rows = assignedRows.filter((row) => selected.has(row.guest.phone) && isEligible(row));
    if (!rows.length) return;

    const ok = await confirm({
      title: "Envoi groupé",
      message: `Envoyer l'invitation PDF à ${rows.length} invité(s) ?`,
      detail: "Chaque message inclut un PDF personnalisé (nom, QR code) via Twilio.",
      confirmLabel: `Envoyer (${rows.length})`,
      variant: "whatsapp",
      icon: MessageCircle,
    });
    if (!ok) return;

    setBulkStatus(`Envoi en cours (${rows.length})…`);
    try {
      const data = await toastPromise(
        postAdmin("send_table_invitation_bulk", {
          recipients: rows.map((row) => ({
            guestId: row.guestId,
            phone: row.guest.phone,
            name: row.guest.name,
            token: row.guest.token,
            genre: row.guest.genre,
          })),
        }).then(assertSuccess),
        {
          pending: `Envoi à ${rows.length} invité(s)…`,
          success: `${rows.length} invitation(s) traitée(s)`,
        }
      );
      const sentIds: string[] = [];
      data.results?.forEach((r: { guestId: string; success: boolean }) => {
        if (r.success) sentIds.push(r.guestId);
      });
      if (sentIds.length) onInvitationsSent(sentIds);
      setSelected(new Set());
      setBulkStatus(`${data.sent} / ${data.total} envoyés.`);
    } catch {
      setBulkStatus("");
    }
  };

  return (
    <>
      <ColoredStatsGrid items={stats} className="admin-invitations-stats" />

      <div className="admin-info-banner">
        <Icon icon={Info} size={18} />
        <div>
          Chaque envoi génère un PDF à partir de <code>public/docs/invitation.pdf</code> avec le nom
          et un QR code unique. Template Twilio : corps <code>{`{{1}}`}</code> = nom ; Media URL{" "}
          <code>https://jennifer-herman.com/api/invitations/{`{{2}}`}.pdf</code> — échantillon{" "}
          <code>{`{{2}}`}</code> = <code>199355</code> (ou le token de l&apos;invité).
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-toolbar" style={{ flex: 1 }}>
            <div className="admin-search">
              <Icon icon={Search} size={15} />
              <input
                type="search"
                placeholder="Rechercher par nom, téléphone, table…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="admin-select"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
            >
              <option value="">Toutes les tables</option>
              {tableOptions.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-success"
              onClick={sendSelected}
              disabled={selected.size === 0}
            >
              <Icon icon={MessageCircle} size={16} className="lucide-icon-wa" />
              Envoyer la sélection ({selected.size})
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
                  <th>Table</th>
                  <th>Pers.</th>
                  <th>Invitation table</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px" }}>
                      <span className="admin-empty">
                        {assignedRows.length === 0
                          ? "Aucun invité assigné à une table."
                          : "Aucun invité trouvé."}
                      </span>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => {
                    const disabledSend = row.invitationSent || row.guest.sendBlocked;
                    return (
                      <tr key={row.guestId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(row.guest.phone)}
                            disabled={disabledSend}
                            onChange={(e) => {
                              const next = new Set(selected);
                              if (e.target.checked) next.add(row.guest.phone);
                              else next.delete(row.guest.phone);
                              setSelected(next);
                            }}
                          />
                        </td>
                        <td>
                          <div className="admin-guest-cell">
                            <GuestAvatar name={row.guest.name} size={36} />
                            <span className="admin-guest-name">{row.guest.name}</span>
                          </div>
                        </td>
                        <td className="admin-mono">{row.guest.phone}</td>
                        <td>
                          <span className="admin-badge admin-badge-outline">{row.tableName}</span>
                        </td>
                        <td>{getPeopleCount(row.guest)}</td>
                        <td>
                          {row.invitationSent ? (
                            <span className="admin-badge admin-badge-success">
                              <Icon icon={Send} size={12} /> Envoyé
                            </span>
                          ) : row.guest.sendBlocked ? (
                            <span className="admin-badge admin-badge-warning">Envoi bloqué</span>
                          ) : (
                            <span className="admin-badge admin-badge-neutral">Non envoyé</span>
                          )}
                        </td>
                        <td className="col-actions">
                          <button
                            type="button"
                            className="admin-icon-btn wa"
                            disabled={disabledSend}
                            onClick={() => sendOne(row)}
                            title={
                              row.guest.sendBlocked
                                ? "Envoi désactivé"
                                : row.invitationSent
                                  ? "Déjà envoyé"
                                  : "Envoyer l'invitation de table"
                            }
                          >
                            <Icon icon={MessageCircle} size={16} className="lucide-icon-wa" />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            disabled={row.invitationSent}
                            onClick={async () => {
                              const ok = await confirm({
                                title: "Marquer comme envoyé",
                                message: `Marquer l'invitation de ${row.guest.name} comme « envoyée » ?`,
                                detail: "Aucun message WhatsApp ne sera envoyé.",
                                confirmLabel: "Marquer envoyé",
                                variant: "success",
                                icon: CheckCheck,
                              });
                              if (!ok) return;
                              try {
                                await toastPromise(
                                  postTables("mark_invitation_sent", { guestId: row.guestId }).then(assertSuccess),
                                  {
                                    pending: "Mise à jour…",
                                    success: `Invitation marquée pour ${row.guest.name}`,
                                  }
                                );
                                onInvitationSent(row.guestId);
                              } catch {
                                /* toast affiché */
                              }
                            }}
                            title="Marquer comme envoyé (sans envoi)"
                          >
                            <Icon icon={CheckCheck} size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredRows.length > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              totalItems={filteredRows.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>

      {ConfirmDialog}
    </>
  );
}
