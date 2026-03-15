"use client";

import { useEffect, useRef } from "react";

export default function Scanner({ onScan }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const lastScanRef = useRef(0);

  useEffect(() => {
    if (startedRef.current) return; // 🔥 chặn start 2 lần
    startedRef.current = true;

    let scanner;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");

      scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 5,
            qrbox: 250,
          },
          (decodedText) => {
            const now = Date.now();

            if (now - lastScanRef.current < 1500) return;
            lastScanRef.current = now;

            if (onScan) onScan(decodedText);
          },
        );
      } catch (err) {
        console.error("Scanner error:", err);
      }
    };

    startScanner();

    return async () => {
      try {
        if (scannerRef.current) {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        }
      } catch {}
    };
  }, []);

  return (
    <div
      id="reader"
      style={{
        width: "100%",
      }}
    />
  );
}
