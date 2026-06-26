"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Props = {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export default function PeopleCountStepper({ value, min = 1, max, disabled, onChange }: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, n));
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <div className="admin-people-count-stepper" title="Nombre de personnes">
      <button
        type="button"
        className="admin-people-count-btn"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Réduire"
      >
        <Icon icon={Minus} size={14} />
      </button>
      <input
        type="number"
        className="admin-people-count-input"
        value={draft}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        aria-label="Nombre de personnes"
      />
      <button
        type="button"
        className="admin-people-count-btn"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Augmenter"
      >
        <Icon icon={Plus} size={14} />
      </button>
    </div>
  );
}
