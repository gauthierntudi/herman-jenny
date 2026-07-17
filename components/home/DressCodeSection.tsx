"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { dressCodeMoments, type PantoneSwatch } from "@/lib/dress-code-palette";

function RibbonSwatch({ name, hex, role }: PantoneSwatch) {
  return (
    <article className="dress-ribbon-swatch" style={{ ["--swatch" as string]: hex }}>
      <div className="dress-ribbon-swatch__tone" aria-hidden="true" />
      <div className="dress-ribbon-swatch__meta">
        <h3 className="dress-ribbon-swatch__name">{name}</h3>
        <p className="dress-ribbon-swatch__role">{role}</p>
      </div>
    </article>
  );
}

export default function DressCodeSection() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeOffcanvas = useCallback(() => {
    document.querySelector(".tp-offcanvas-area")?.classList.remove("opened");
    document.querySelector(".body-overlay")?.classList.remove("opened");
    document.body.classList.remove("overflow-hidden");
  }, []);

  const openModal = useCallback(() => {
    closeOffcanvas();
    setOpen(true);
  }, [closeOffcanvas]);
  const closeModal = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#dress-code") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const onTrigger = (event: Event) => {
      event.preventDefault();
      openModal();
    };

    const triggers = document.querySelectorAll<HTMLElement>("[data-open-dress-code]");
    triggers.forEach((el) => el.addEventListener("click", onTrigger));

    if (window.location.hash === "#dress-code") {
      openModal();
    }

    const onHash = () => {
      if (window.location.hash === "#dress-code") openModal();
    };
    window.addEventListener("hashchange", onHash);

    return () => {
      triggers.forEach((el) => el.removeEventListener("click", onTrigger));
      window.removeEventListener("hashchange", onHash);
    };
  }, [openModal]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeModal]);

  return (
    <>
      <section id="dress-code" className="dress-code-section" aria-labelledby={titleId}>
        <div className="dress-code-section__media">
          <img src="/img/dress.jpg" alt="Herman & Jennifer — dress code reference" />
        </div>
        <div className="dress-code-section__copy">
          <span className="dress-code-section__eyebrow">Two moments · Two palettes</span>
          <h2 id={titleId} className="dress-code-section__title">
            Dress Code
          </h2>
          <p className="dress-code-section__text">
            Nuptial Blessing in Pantone creams. Evening party in black & gold.
          </p>
          <button type="button" className="dress-code-section__cta" data-open-dress-code onClick={openModal}>
            View Pantone
          </button>
        </div>
      </section>

      {mounted && open
        ? createPortal(
            <div
              className="dress-code-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Dress Code Pantone"
            >
              <div className="dress-code-modal__backdrop" onClick={closeModal} aria-hidden="true" />
              <div className="dress-code-modal__panel">
                <button
                  type="button"
                  className="dress-code-modal__close"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={22} strokeWidth={1.5} />
                </button>

                <div className="dress-code-modal__moments">
                  {dressCodeMoments.map((moment) => (
                    <section
                      key={moment.id}
                      className={`dress-code-moment dress-code-moment--${moment.id}`}
                      aria-labelledby={`dress-moment-${moment.id}`}
                    >
                      <header className="dress-code-moment__header">
                        <div className="dress-code-moment__heading">
                          <span className="dress-code-moment__subtitle">{moment.subtitle}</span>
                          <h3 id={`dress-moment-${moment.id}`} className="dress-code-moment__title">
                            {moment.title}
                          </h3>
                        </div>
                        <p className="dress-code-moment__note">{moment.note}</p>
                      </header>
                      <div className="dress-code-ribbon">
                        {moment.swatches.map((swatch) => (
                          <RibbonSwatch key={`${moment.id}-${swatch.code}`} {...swatch} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
