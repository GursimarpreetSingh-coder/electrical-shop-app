"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setError(null);

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("barcode-scanner-region");
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          setError("Camera nahi mili — permission allow karo");
          return;
        }

        const backCam =
          cameras.find((c) => /back|rear|environment/i.test(c.label)) ??
          cameras[cameras.length - 1];

        await scanner.start(
          backCam.id,
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decoded) => {
            if (!mounted) return;
            onScan(decoded);
            scanner
              .stop()
              .then(() => onClose())
              .catch(() => onClose());
          },
          () => {}
        );
      } catch (e) {
        if (mounted) {
          setError(
            e instanceof Error
              ? e.message
              : "Scan start nahi hua — HTTPS/localhost + camera allow"
          );
        }
      }
    })();

    return () => {
      mounted = false;
      scannerRef.current
        ?.stop()
        .catch(() => {})
        .finally(() => {
          scannerRef.current = null;
        });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- stable callbacks from parent
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Scan barcode / QR</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          id="barcode-scanner-region"
          className="w-full overflow-hidden rounded-xl bg-black min-h-[240px]"
        />
        {error && (
          <p className="text-sm text-red-400 mt-3">{error}</p>
        )}
        <Button variant="secondary" className="w-full mt-3" onClick={onClose}>
          Band karo
        </Button>
      </div>
    </div>
  );
}
