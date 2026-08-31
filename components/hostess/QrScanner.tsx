"use client";

import { useEffect, useId, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

type Props = {
  active: boolean;
  onScan: (value: string) => void;
};

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

export default function QrScanner({ active, onScan }: Props) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const regionId = `hostess-qr-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const run = (async () => {
      const instance = new Html5Qrcode(regionId);
      scanner = instance;
      if (cancelled) {
        await stopScanner(instance);
        return;
      }

      try {
        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
              return { width: Math.max(220, size), height: Math.max(220, size) };
            },
          },
          (decodedText) => {
            if (cancelled || !decodedText) return;
            onScanRef.current(decodedText);
          },
          () => {}
        );
      } catch {
        return;
      }

      if (cancelled) await stopScanner(instance);
    })();

    return () => {
      cancelled = true;
      void run.then(() => {
        if (scanner) return stopScanner(scanner);
      });
    };
  }, [active, regionId]);

  return (
    <div className="hostess-scanner">
      <div id={regionId} className="hostess-qr" />
      <div className="hostess-scanner-frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="hostess-scanner-hint">Cadrez le QR de l’invitation</p>
    </div>
  );
}
