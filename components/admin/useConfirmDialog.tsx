"use client";

import type { LucideIcon } from "lucide-react";
import { CircleHelp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type ConfirmVariant = "default" | "success" | "danger" | "whatsapp";

export type ConfirmOptions = {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const DEFAULTS: Required<Pick<ConfirmOptions, "confirmLabel" | "cancelLabel" | "variant">> & {
  icon: LucideIcon;
} = {
  confirmLabel: "Confirmer",
  cancelLabel: "Annuler",
  variant: "default",
  icon: CircleHelp,
};

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({
        ...DEFAULTS,
        ...options,
        resolve,
      });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    confirmBtnRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [pending, close]);

  const ConfirmDialog = pending ? (
    <div className="admin-modal-overlay" onClick={() => close(false)} role="presentation">
      <div
        className="admin-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        aria-describedby="admin-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`admin-modal-icon ${pending.variant}`}>
          <Icon icon={pending.icon ?? CircleHelp} size={28} strokeWidth={1.75} />
        </div>

        <h2 id="admin-modal-title" className="admin-modal-title">
          {pending.title}
        </h2>
        <p id="admin-modal-desc" className="admin-modal-message">
          {pending.message}
        </p>
        {pending.detail && <p className="admin-modal-detail">{pending.detail}</p>}

        <div className="admin-modal-actions">
          <button type="button" className="admin-modal-btn cancel" onClick={() => close(false)}>
            {pending.cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`admin-modal-btn confirm ${pending.variant}`}
            onClick={() => close(true)}
          >
            {pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmDialog };
}
