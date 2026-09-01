"use client";

import { Camera, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Icon } from "@/components/ui/Icon";

type Props = {
  active: boolean;
  onScan: (value: string) => void;
};

type Status = "idle" | "starting" | "live" | "error";

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

let cameraUnlocked = false;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function cameraErrorMessage(error: unknown) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "La caméra est bloquée en HTTP. Ouvrez l’app en HTTPS.";
  }
  const raw = error instanceof Error ? error.message : String(error || "");
  const text = raw.toLowerCase();
  if (text.includes("notallowed") || text.includes("permission") || text.includes("denied")) {
    return "Autorisez la caméra dans Réglages, puis réessayez.";
  }
  if (text.includes("notfound") || text.includes("requested device")) {
    return "Aucune caméra n’a été trouvée sur cet appareil.";
  }
  if (text.includes("notreadable") || text.includes("in use") || text.includes("trackstart")) {
    return "La caméra est déjà utilisée. Fermez les autres apps, puis réessayez.";
  }
  return "Impossible d’ouvrir la caméra. Appuyez pour réessayer.";
}

async function openCamera() {
  const attempts: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: { facingMode: "environment" } },
    { audio: false, video: { facingMode: "user" } },
    { audio: false, video: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("no camera");
}

function attachVideo(video: HTMLVideoElement, stream: MediaStream) {
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
  video.srcObject = stream;
  return video.play();
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function QrScanner({ active, onScan }: Props) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const handledRef = useRef(false);

  const [status, setStatus] = useState<Status>(cameraUnlocked ? "starting" : "idle");
  const [message, setMessage] = useState("");

  const stopLoop = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current);
    handledRef.current = false;
    stopStream(streamRef.current);
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  const scanFrame = useCallback(async (detector: BarcodeDetectorLike | null) => {
    if (handledRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    if (detector) {
      try {
        const codes = await detector.detect(video);
        const value = codes.find((code) => code.rawValue)?.rawValue?.trim();
        if (value) {
          handledRef.current = true;
          onScanRef.current(value);
          return;
        }
      } catch {
        /* fallback to jsQR */
      }
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const width = 480;
    const height = Math.max(1, Math.round((video.videoHeight / Math.max(video.videoWidth, 1)) * width));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);
    const image = ctx.getImageData(0, 0, width, height);
    const result = jsQR(image.data, width, height, { inversionAttempts: "attemptBoth" });
    if (result?.data) {
      handledRef.current = true;
      onScanRef.current(result.data.trim());
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage("Ce navigateur ne permet pas d’utiliser la caméra.");
      return;
    }

    setStatus("starting");
    setMessage("");
    handledRef.current = false;

    try {
      const stream = await openCamera();
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopStream(stream);
        return;
      }
      await attachVideo(video, stream);
      cameraUnlocked = true;
      setStatus("live");

      const Detector = (window as Window & { BarcodeDetector?: new (opts?: { formats: string[] }) => BarcodeDetectorLike })
        .BarcodeDetector;
      let detector: BarcodeDetectorLike | null = null;
      if (Detector) {
        try {
          detector = new Detector({ formats: ["qr_code"] });
        } catch {
          detector = null;
        }
      }

      const tick = () => {
        void scanFrame(detector).finally(() => {
          if (!handledRef.current) rafRef.current = window.requestAnimationFrame(tick);
        });
      };
      rafRef.current = window.requestAnimationFrame(tick);
    } catch (error) {
      stopStream(streamRef.current);
      streamRef.current = null;
      setStatus("error");
      setMessage(cameraErrorMessage(error));
    }
  }, [scanFrame]);

  useEffect(() => {
    if (!active) {
      stopLoop();
      return;
    }

    handledRef.current = false;
    if (cameraUnlocked || !isStandalone()) {
      void startCamera();
    } else {
      setStatus("idle");
    }

    return () => {
      stopLoop();
    };
  }, [active, startCamera, stopLoop]);

  if (!active) return null;

  return (
    <div className="hostess-scanner">
      <div className="hostess-qr">
        <video ref={videoRef} muted playsInline autoPlay controls={false} />
        <canvas ref={canvasRef} className="hostess-qr-canvas" aria-hidden="true" />
      </div>
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
              <p>
                {status === "error"
                  ? message
                  : isStandalone()
                    ? "Dans l’app, la caméra s’ouvre uniquement si vous appuyez."
                    : "Appuyez pour activer la caméra."}
              </p>
              <button type="button" onClick={() => void startCamera()}>
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
