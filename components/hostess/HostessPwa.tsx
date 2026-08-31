"use client";

import { useEffect, useState } from "react";

export default function HostessPwa() {
  const [installHint, setInstallHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-hostess.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (!standalone) {
      const dismissed = sessionStorage.getItem("hostess-install-hint") === "1";
      if (!dismissed) setInstallHint(true);
    }
  }, []);

  if (!installHint) return null;

  return (
    <div className="hostess-install">
      <p>
        Ajoutez l’app à l’écran d’accueil pour un accès rapide le jour J
        <span>Safari : Partager → Sur l’écran d’accueil</span>
      </p>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem("hostess-install-hint", "1");
          setInstallHint(false);
        }}
      >
        OK
      </button>
    </div>
  );
}
