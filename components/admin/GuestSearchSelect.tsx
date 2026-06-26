"use client";

import { Guest } from "@prisma/client";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getPeopleCount } from "@/lib/people-count";

type Props = {
  guests: Guest[];
  value: string;
  onChange: (guestId: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
  placeholder?: string;
};

export default function GuestSearchSelect({
  guests,
  value,
  onChange,
  disabled,
  emptyMessage = "Tous les invités sont assignés",
  placeholder = "Rechercher un invité…",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => guests.find((g) => g.id === value), [guests, value]);

  const displayPeopleCount = (guest: Guest) => String(getPeopleCount(guest));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) => g.name.toLowerCase().includes(q) || g.phone.includes(q) || g.token.toLowerCase().includes(q)
    );
  }, [guests, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const pick = (guestId: string) => {
    onChange(guestId);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (!open || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(filtered[highlight].id);
    }
  };

  if (guests.length === 0) {
    return (
      <div className="admin-guest-search admin-guest-search-disabled">
        <input className="admin-input" disabled value={emptyMessage} readOnly />
      </div>
    );
  }

  return (
    <div className={`admin-guest-search${open ? " open" : ""}`} ref={rootRef}>
      <div className="admin-guest-search-input-wrap">
        <Icon icon={Search} size={15} className="admin-guest-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="admin-input admin-guest-search-input"
          value={
            open
              ? query
              : selected
                ? `${selected.name} ${displayPeopleCount(selected)} — ${selected.phone}`
                : query
          }
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected && !open ? undefined : placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="guest-search-list"
        />
        {(selected || query) && !disabled && (
          <button
            type="button"
            className="admin-guest-search-clear"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Effacer la sélection"
          >
            <Icon icon={X} size={14} />
          </button>
        )}
      </div>

      {open && !disabled && (
        <ul id="guest-search-list" className="admin-guest-search-list" role="listbox">
          {filtered.length === 0 ? (
            <li className="admin-guest-search-empty">Aucun invité trouvé</li>
          ) : (
            filtered.slice(0, 80).map((g, i) => (
              <li key={g.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === g.id}
                  className={`admin-guest-search-option${value === g.id ? " selected" : ""}${highlight === i ? " highlighted" : ""}`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(g.id)}
                >
                  <span className="admin-guest-search-name">
                    {g.name}
                    <span className="admin-guest-search-count">{displayPeopleCount(g)}</span>
                  </span>
                  <span className="admin-guest-search-phone">{g.phone}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
