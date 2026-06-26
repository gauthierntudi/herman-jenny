"use client";

import { Guest, TableAssignment, WeddingTable } from "@prisma/client";
import {
  ChevronDown,
  Loader2,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/components/admin/useConfirmDialog";
import GuestSearchSelect from "@/components/admin/GuestSearchSelect";
import GuestAvatar from "@/components/admin/GuestAvatar";
import PeopleCountStepper from "@/components/admin/PeopleCountStepper";
import TablesStats from "@/components/admin/TablesStats";
import { Icon } from "@/components/ui/Icon";
import { getPeopleCount, sumPeopleCount, sumTableOccupied } from "@/lib/people-count";
import { assertSuccess, toastError, toastPromise, toastSuccess } from "@/lib/admin-toast";

export type WeddingTableWithGuests = WeddingTable & {
  assignments: (TableAssignment & { guest: Guest })[];
};

type Props = {
  guests: Guest[];
  tables: WeddingTableWithGuests[];
  setTables: React.Dispatch<React.SetStateAction<WeddingTableWithGuests[]>>;
  onGuestAdded: (guest: Guest) => void;
  onGuestUpdated: (guest: Guest) => void;
};

async function postTables(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/tables", {
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

export default function TablesTab({ guests, tables, setTables, onGuestAdded, onGuestUpdated }: Props) {
  const [newName, setNewName] = useState("");
  const [newSeats, setNewSeats] = useState("8");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(tables[0]?.id ? [tables[0].id] : []));

  const toggleExpanded = (tableId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  };
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (!createModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creating) setCreateModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [createModalOpen, creating]);

  const openCreateModal = () => {
    setNewName("");
    setNewSeats("8");
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateModalOpen(false);
  };

  const assignedGuestIds = useMemo(() => {
    const ids = new Set<string>();
    tables.forEach((t) => t.assignments.forEach((a) => ids.add(a.guestId)));
    return ids;
  }, [tables]);

  const unassignedGuests = useMemo(
    () => guests.filter((g) => !assignedGuestIds.has(g.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [guests, assignedGuestIds]
  );

  const totalSeats = tables.reduce((s, t) => s + t.seatCount, 0);
  const totalAssigned = tables.reduce((s, t) => s + sumTableOccupied(t.assignments), 0);

  const totalPeople = useMemo(() => sumPeopleCount(guests), [guests]);
  const assignedPeople = useMemo(
    () => sumPeopleCount(guests.filter((g) => assignedGuestIds.has(g.id))),
    [guests, assignedGuestIds]
  );
  const unassignedPeople = useMemo(() => sumPeopleCount(unassignedGuests), [unassignedGuests]);

  const replaceTable = (updated: WeddingTableWithGuests) => {
    setTables((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const updateGuestInTables = (guest: Guest) => {
    setTables((prev) =>
      prev.map((t) => ({
        ...t,
        assignments: t.assignments.map((a) =>
          a.guestId === guest.id ? { ...a, guest } : a
        ),
      }))
    );
  };

  const handleGuestUpdated = (guest: Guest) => {
    updateGuestInTables(guest);
    onGuestUpdated(guest);
  };

  const createTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const seatCount = parseInt(newSeats, 10);
    if (!newName.trim() || !seatCount || seatCount < 1) return;

    setCreating(true);
    try {
      const data = await toastPromise(
        postTables("create_table", { name: newName.trim(), seatCount }).then(assertSuccess),
        {
          pending: "Création de la table…",
          success: "Table créée",
        }
      );
      setTables((prev) => [...prev, data.table].sort((a, b) => a.name.localeCompare(b.name)));
      setExpandedIds((prev) => new Set(prev).add(data.table.id));
      setCreateModalOpen(false);
    } catch {
      /* toast affiché */
    } finally {
      setCreating(false);
    }
  };

  const deleteTable = async (table: WeddingTableWithGuests) => {
    const ok = await confirm({
      title: "Supprimer la table",
      message: `Supprimer « ${table.name} » ?`,
      detail:
        table.assignments.length > 0
          ? `${table.assignments.length} invité(s) seront désassignés (restent dans la liste invités).`
          : undefined,
      confirmLabel: "Supprimer",
      variant: "danger",
      icon: Trash2,
    });
    if (!ok) return;

    try {
      await toastPromise(
        postTables("delete_table", { id: table.id }).then(assertSuccess),
        {
          pending: "Suppression…",
          success: `Table « ${table.name} » supprimée`,
        }
      );
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(table.id);
        return next;
      });
    } catch {
      /* toast affiché */
    }
  };

  return (
    <>
      <TablesStats
        totalPeople={totalPeople}
        assignedPeople={assignedPeople}
        unassignedPeople={unassignedPeople}
        tableCount={tables.length}
        totalSeats={totalSeats}
        totalAssigned={totalAssigned}
      />

      <div className="admin-tables-toolbar">
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateModal}>
          <Icon icon={Plus} size={16} />
          Nouvelle table
        </button>
      </div>

      {createModalOpen && (
        <div className="admin-modal-overlay" onClick={closeCreateModal} role="presentation">
          <div
            className="admin-modal admin-modal-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-table-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-icon default">
              <Icon icon={UtensilsCrossed} size={28} strokeWidth={1.75} aria-hidden />
            </div>
            <h2 id="create-table-title" className="admin-modal-title">
              Nouvelle table
            </h2>
            <p className="admin-modal-message">Définissez le nom et le nombre de places.</p>

            <form className="admin-modal-fields" onSubmit={createTable}>
              <div className="admin-form-field">
                <label htmlFor="table-name">Nom de la table</label>
                <input
                  id="table-name"
                  className="admin-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex. Table 1, Famille, Amis…"
                  required
                  autoFocus
                  disabled={creating}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="table-seats">Nombre de places</label>
                <input
                  id="table-seats"
                  className="admin-input"
                  type="number"
                  min={1}
                  max={50}
                  value={newSeats}
                  onChange={(e) => setNewSeats(e.target.value)}
                  required
                  disabled={creating}
                />
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-btn cancel" onClick={closeCreateModal} disabled={creating}>
                  Annuler
                </button>
                <button type="submit" className="admin-modal-btn confirm default" disabled={creating}>
                  {creating ? (
                    <>
                      <Icon icon={Loader2} spin size={18} />
                      Création…
                    </>
                  ) : (
                    <>
                      <Icon icon={Plus} size={16} />
                      Créer la table
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="admin-panel">
          <div className="admin-panel-body admin-empty-state">
            <Icon icon={UtensilsCrossed} size={20} />
            <p>Aucune table créée.</p>
            <button type="button" className="admin-btn admin-btn-primary" onClick={openCreateModal}>
              <Icon icon={Plus} size={16} />
              Créer une table
            </button>
          </div>
        </div>
      ) : (
        <div className="admin-tables-grid">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              expanded={expandedIds.has(table.id)}
              onToggle={() => toggleExpanded(table.id)}
              unassignedGuests={unassignedGuests}
              onUpdate={replaceTable}
              onDelete={() => deleteTable(table)}
              onGuestAdded={onGuestAdded}
              onGuestUpdated={handleGuestUpdated}
            />
          ))}
        </div>
      )}

      {ConfirmDialog}
    </>
  );
}

function TableCard({
  table,
  expanded,
  onToggle,
  unassignedGuests,
  onUpdate,
  onDelete,
  onGuestAdded,
  onGuestUpdated,
}: {
  table: WeddingTableWithGuests;
  expanded: boolean;
  onToggle: () => void;
  unassignedGuests: Guest[];
  onUpdate: (t: WeddingTableWithGuests) => void;
  onDelete: () => void;
  onGuestAdded: (guest: Guest) => void;
  onGuestUpdated: (guest: Guest) => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingPeopleCountId, setUpdatingPeopleCountId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(table.name);
  const [editSeats, setEditSeats] = useState(String(table.seatCount));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditName(table.name);
    setEditSeats(String(table.seatCount));
  }, [table.name, table.seatCount]);

  useEffect(() => {
    if (!editModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) setEditModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [editModalOpen, saving]);

  const openEditModal = () => {
    setEditName(table.name);
    setEditSeats(String(table.seatCount));
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditModalOpen(false);
  };

  const getMaxPeopleForGuest = (guestId: string) => {
    const others = table.assignments.filter((a) => a.guestId !== guestId);
    return Math.max(1, table.seatCount - sumTableOccupied(others));
  };

  const occupied = sumTableOccupied(table.assignments);
  const remaining = table.seatCount - occupied;
  const full = remaining <= 0;
  const pct = Math.min(100, Math.round((occupied / table.seatCount) * 100));
  const minSeats = Math.max(1, occupied);

  const selectedGuest = useMemo(
    () => unassignedGuests.find((g) => g.id === selectedGuestId),
    [unassignedGuests, selectedGuestId]
  );
  const selectedFits = selectedGuest ? getPeopleCount(selectedGuest) <= remaining : false;

  const saveTableSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const seatCount = parseInt(editSeats, 10);
    if (!editName.trim() || !seatCount || seatCount < minSeats) return;

    setSaving(true);
    try {
      const data = await toastPromise(
        postTables("update_table", {
          id: table.id,
          name: editName.trim(),
          seatCount,
        }).then(assertSuccess),
        {
          pending: "Mise à jour…",
          success: "Table mise à jour",
        }
      );
      onUpdate(data.table);
      setEditModalOpen(false);
    } catch {
      /* toast affiché */
    } finally {
      setSaving(false);
    }
  };

  const assignExisting = async () => {
    if (!selectedGuestId || full || !selectedFits) return;
    setLoading(true);
    try {
      const data = await toastPromise(
        postTables("assign_guest", { tableId: table.id, guestId: selectedGuestId }).then(assertSuccess),
        {
          pending: "Assignation…",
          success: "Invité assigné à la table",
        }
      );
      onUpdate(data.table);
      setSelectedGuestId("");
    } catch {
      /* toast affiché */
    } finally {
      setLoading(false);
    }
  };

  const assignNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (full) return;
    setLoading(true);
    try {
      const data = await toastPromise(
        postTables("create_and_assign", {
          tableId: table.id,
          name: newGuestName.trim(),
          phone: newGuestPhone.trim(),
        }).then(assertSuccess),
        {
          pending: "Création et assignation…",
          success: "Invité créé et assigné",
        }
      );
      onUpdate(data.table);
      onGuestAdded(data.guest);
      setNewGuestName("");
      setNewGuestPhone("");
      setMode("existing");
    } catch {
      /* toast affiché */
    } finally {
      setLoading(false);
    }
  };

  const unassign = async (guestId: string) => {
    try {
      const data = await toastPromise(
        postTables("unassign_guest", { guestId }).then(assertSuccess),
        {
          pending: "Retrait de la table…",
          success: "Invité retiré de la table",
        }
      );
      onUpdate(data.table);
    } catch {
      /* toast affiché */
    }
  };

  const updatePeopleCount = async (guestId: string, peopleCount: number) => {
    const assignment = table.assignments.find((a) => a.guestId === guestId);
    if (!assignment) return;

    const current = getPeopleCount(assignment.guest);
    if (peopleCount === current) return;

    setUpdatingPeopleCountId(guestId);
    try {
      const data = await postGuests("update_people_count", { guestId, peopleCount }).then(assertSuccess);
      onGuestUpdated(data.guest);
      toastSuccess(`${assignment.guest.name} : ${peopleCount} personne${peopleCount > 1 ? "s" : ""}`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUpdatingPeopleCountId(null);
    }
  };

  return (
    <div className={`admin-table-card${full ? " full" : ""}${expanded ? " expanded" : ""}`}>
      <div className="admin-table-card-header">
        <button type="button" className="admin-table-card-toggle" onClick={onToggle}>
          <div className="admin-table-card-title">
            <Icon icon={UtensilsCrossed} size={20} />
            <span>{table.name}</span>
          </div>
          <div className="admin-table-card-meta">
            <span className={`admin-table-capacity${full ? " full" : ""}`}>
              {occupied}/{table.seatCount} places
            </span>
            <Icon icon={ChevronDown} size={16} className={`admin-table-chevron${expanded ? " open" : ""}`} />
          </div>
        </button>
        <div className="admin-table-card-actions">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={openEditModal}
            title="Paramètres de la table"
          >
            <Icon icon={Settings} size={16} />
          </button>
          <button
            type="button"
            className="admin-icon-btn admin-btn-danger"
            onClick={onDelete}
            title="Supprimer la table"
          >
            <Icon icon={Trash2} size={16} />
          </button>
        </div>
      </div>

      <div className="admin-table-progress">
        <div className="admin-table-progress-bar" style={{ width: `${pct}%` }} />
      </div>

      {expanded && (
        <div className="admin-table-card-body">
          {table.assignments.length === 0 ? (
            <p className="admin-empty">Aucun invité assigné</p>
          ) : (
            <ul className="admin-table-guest-list">
              {table.assignments.map((a) => (
                <li key={a.id}>
                  <div className="admin-table-guest-cell">
                    <GuestAvatar name={a.guest.name} size={34} />
                    <div>
                      <strong>{a.guest.name}</strong>
                      <span className="admin-mono">{a.guest.phone}</span>
                    </div>
                  </div>
                  <div className="admin-table-guest-actions">
                    <PeopleCountStepper
                      value={getPeopleCount(a.guest)}
                      max={getMaxPeopleForGuest(a.guestId)}
                      disabled={loading || updatingPeopleCountId === a.guestId}
                      onChange={(count) => updatePeopleCount(a.guestId, count)}
                    />
                    <button
                      type="button"
                      className="admin-icon-btn"
                      onClick={() => unassign(a.guestId)}
                      title="Retirer de la table"
                    >
                      <Icon icon={X} size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!full && (
            <div className="admin-table-assign">
              <div className="admin-table-assign-tabs">
                <button
                  type="button"
                  className={mode === "existing" ? "active" : ""}
                  onClick={() => setMode("existing")}
                >
                  Invité existant
                </button>
                <button
                  type="button"
                  className={mode === "new" ? "active" : ""}
                  onClick={() => setMode("new")}
                >
                  Nouvel invité
                </button>
              </div>

              {mode === "existing" ? (
                <div className="admin-table-assign-row">
                  <GuestSearchSelect
                    guests={unassignedGuests}
                    value={selectedGuestId}
                    onChange={setSelectedGuestId}
                    disabled={loading || unassignedGuests.length === 0}
                    emptyMessage="Tous les invités sont assignés"
                    placeholder="Rechercher par nom ou téléphone…"
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={!selectedGuestId || loading || !selectedFits}
                    onClick={assignExisting}
                  >
                    Assigner
                  </button>
                </div>
              ) : (
                <form className="admin-table-assign-new" onSubmit={assignNew}>
                  <input
                    className="admin-input"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    placeholder="Nom complet"
                    required
                    disabled={loading}
                  />
                  <input
                    className="admin-input"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    placeholder="Téléphone (E.164)"
                    required
                    disabled={loading}
                  />
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>
                    <Icon icon={UserPlus} size={16} />
                    Créer &amp; assigner
                  </button>
                </form>
              )}
              {mode === "existing" && selectedGuest && !selectedFits && !full && (
                <p className="admin-table-assign-hint admin-table-assign-warn">
                  Il reste {remaining} place(s), cet invité en nécessite {getPeopleCount(selectedGuest)}.
                </p>
              )}
              {mode === "new" && (
                <p className="admin-table-assign-hint">
                  L&apos;invité sera automatiquement ajouté à la liste des invités.
                </p>
              )}
            </div>
          )}

          {full && <p className="admin-table-full-msg">Table complète</p>}
        </div>
      )}

      {editModalOpen && (
        <div className="admin-modal-overlay" onClick={closeEditModal} role="presentation">
          <div
            className="admin-modal admin-modal-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-table-title-${table.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-icon default">
              <Icon icon={Settings} size={28} strokeWidth={1.75} aria-hidden />
            </div>
            <h2 id={`edit-table-title-${table.id}`} className="admin-modal-title">
              Paramètres de la table
            </h2>
            <p className="admin-modal-message">Modifiez le nom et le nombre de places.</p>

            <form className="admin-modal-fields" onSubmit={saveTableSettings}>
              <div className="admin-form-field">
                <label htmlFor={`edit-table-name-${table.id}`}>Nom de la table</label>
                <input
                  id={`edit-table-name-${table.id}`}
                  className="admin-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex. Table 1, Famille, Amis…"
                  required
                  autoFocus
                  disabled={saving}
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor={`edit-table-seats-${table.id}`}>Nombre de places</label>
                <input
                  id={`edit-table-seats-${table.id}`}
                  className="admin-input"
                  type="number"
                  min={minSeats}
                  max={50}
                  value={editSeats}
                  onChange={(e) => setEditSeats(e.target.value)}
                  required
                  disabled={saving}
                />
                {occupied > 0 && (
                  <p className="admin-form-hint">Minimum {minSeats} place{minSeats > 1 ? "s" : ""} ({occupied} occupée{occupied > 1 ? "s" : ""})</p>
                )}
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-btn cancel" onClick={closeEditModal} disabled={saving}>
                  Annuler
                </button>
                <button type="submit" className="admin-modal-btn confirm default" disabled={saving}>
                  {saving ? (
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
    </div>
  );
}
