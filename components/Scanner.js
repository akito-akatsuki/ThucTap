"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function Scanner({ onScan }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const lastScanRef = useRef(0);
  const fileInputRef = useRef(null);
  const [scanningFile, setScanningFile] = useState(false);

  useEffect(() => {
    if (startedRef.current) return;
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

            if (onScan) {
              setTimeout(() => onScan(decodedText), 0); // 🔥 fix React render error
            }
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
  }, [onScan]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!scannerRef.current) {
      toast.error("Camera scanner is not ready yet.");
      return;
    }

    setScanningFile(true);

    try {
      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText && onScan) {
        onScan(decodedText);
      } else {
        toast.error("Không đọc được QR từ ảnh.");
      }
    } catch (err) {
      console.error("File scan error:", err);
      toast.error("Không đọc được QR từ ảnh.");
    } finally {
      setScanningFile(false);
      event.target.value = null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        id="reader"
        style={{
          width: "100%",
          minHeight: "100%",
        }}
      />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleFileClick}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
          disabled={scanningFile}
        >
          {scanningFile ? "Đang quét ảnh..." : "Add file"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
