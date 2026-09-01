"use client";

import { Camera, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Icon } from "@/components/ui/Icon";

type Props = {
  active: boolean;
  onScan: (value: string) => void;
};

type Status = "starting" | "live" | "error";

async function stopScanner(scanner: Html5Qrcode) {
  try {
    const state = scanner.getState();
    if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
      await scanner.stop();
    }
  } catch {
    /* already stopped */
  }
  try {
    scanner.clear();
  } catch {
    /* already cleared */
  }
}

function cameraErrorMessage(error: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "La caméra est bloquée en HTTP. Ouvrez l’app en HTTPS, ou via localhost sur cet ordinateur.";
  }

  const raw = error instanceof Error ? error.message : String(error || "");
  const text = raw.toLowerCase();

  if (text.includes("notallowed") || text.includes("permission") || text.includes("denied")) {
    return "Autorisez la caméra dans les réglages du navigateur, puis réessayez.";
  }
  if (text.includes("notfound") || text.includes("no camera") || text.includes("requested device not found")) {
    return "Aucune caméra n’a été trouvée sur cet appareil.";
  }
  if (text.includes("notreadable") || text.includes("trackstart") || text.includes("in use")) {
    return "La caméra est déjà utilisée par une autre app. Fermez-la puis réessayez.";
  }
  return "Impossible d’ouvrir la caméra. Autorisez l’accès puis réessayez.";
}

async function pickCameraId() {
  const cameras = await Html5Qrcode.getCameras();
  if (!cameras.length) throw new Error("no camera");
  const back = cameras.find((camera) => /back|rear|environment|arrière|world/i.test(camera.label));
  if (back) return back.id;
  const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  return (mobile ? cameras[cameras.length - 1] : cameras[0]).id;
}

function prepareVideo(root: HTMLElement | null) {
  const video = root?.querySelector("video");
  if (!(video instanceof HTMLVideoElement)) return;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.muted = true;
  video.playsInline = true;
  void video.play().catch(() => {});
}

export default function QrScanner({ active, onScan }: Props) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const regionId = `hostess-qr-${useId().replace(/:/g, "")}`;
  const [status, setStatus] = useState<Status>("starting");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;
    setStatus("starting");
    setMessage("");

    const boot = window.setTimeout(() => {
      void (async () => {
        const root = document.getElementById(regionId);
        if (!root || cancelled) return;

        const instance = new Html5Qrcode(regionId);
        scanner = instance;
        let handled = false;

        try {
          const cameraId = await pickCameraId().catch(() => null);
          if (cancelled) {
            await stopScanner(instance);
            return;
          }

          const onDecoded = (decodedText: string) => {
            if (cancelled || !decodedText || handled) return;
            handled = true;
            try {
              scanner?.pause(true);
            } catch {
              /* keep going */
            }
            onScanRef.current(decodedText.trim());
          };
          const config = { fps: 12 };

          try {
            await instance.start(cameraId || { facingMode: "environment" }, config, onDecoded, () => {});
          } catch {
            if (cancelled) {
              await stopScanner(instance);
              return;
            }
            await stopScanner(instance);
            const fallback = new Html5Qrcode(regionId);
            scanner = fallback;
            await fallback.start({ facingMode: "user" }, config, onDecoded, () => {});
          }

          if (cancelled) {
            if (scanner) await stopScanner(scanner);
            return;
          }

          prepareVideo(root);
          setStatus("live");
        } catch (error) {
          if (scanner) await stopScanner(scanner);
          if (cancelled) return;
          setStatus("error");
          setMessage(cameraErrorMessage(error));
        }
      })();
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(boot);
      if (scanner) void stopScanner(scanner);
    };
  }, [active, regionId, retry]);

  if (!active) return null;

  return (
    <div className="hostess-scanner">
      <div id={regionId} className="hostess-qr" />
      <div className="hostess-scanner-frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      {status !== "live" && (
        <div className="hostess-scanner-overlay">
          {status === "starting" ? (
            <>
              <Icon icon={Loader2} spin size={28} />
              <p>Ouverture de la caméra…</p>
            </>
          ) : (
            <>
              <Icon icon={Camera} size={28} />
              <p>{message}</p>
              <button type="button" onClick={() => setRetry((n) => n + 1)}>
                Activer la caméra
              </button>
            </>
          )}
        </div>
      )}
      <p className="hostess-scanner-hint">Cadrez le QR de l’invitation</p>
    </div>
  );
}
