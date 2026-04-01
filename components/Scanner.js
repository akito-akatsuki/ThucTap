"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function Scanner({ onScan }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const lastScanRef = useRef(0);
  const fileInputRef = useRef(null);
  const [scanningFile, setScanningFile] = useState(false);

  /* =========================
     START CAMERA
  ========================= */
  const startCamera = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.start(
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
            setTimeout(() => onScan(decodedText), 0);
          }
        },
      );
    } catch (err) {
      console.error("Start camera error:", err);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let scanner;

    const init = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");

      scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await startCamera();
    };

    init();

    return async () => {
      try {
        if (scannerRef.current) {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        }
      } catch {}
    };
  }, [onScan]);

  /* =========================
     FILE SCAN
  ========================= */
  /* =========================
      FILE SCAN (FIXED)
  ========================= */
  const handleFileClick = async () => {
    if (!scannerRef.current) return;

    try {
      // Dừng camera trước khi chọn file
      await scannerRef.current.stop();
    } catch (err) {
      console.log("Stop camera warning:", err);
    }

    // Đăng ký một sự kiện lắng nghe duy nhất khi quay lại cửa sổ
    const onFocusBack = () => {
      window.removeEventListener("focus", onFocusBack);

      // Đợi một chút để xem onChange có chạy không (nếu có file)
      // Nếu sau 500ms mà không có file, khởi động lại camera
      setTimeout(async () => {
        if (!fileInputRef.current?.files?.length) {
          await startCamera();
        }
      }, 500);
    };

    window.addEventListener("focus", onFocusBack);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target?.files?.[0];

    // Trường hợp này thường không chạy trên một số trình duyệt khi cancel
    if (!file) {
      await startCamera();
      return;
    }

    if (!scannerRef.current) {
      toast.error("Scanner chưa sẵn sàng");
      return;
    }

    setScanningFile(true);

    try {
      const decodedText = await scannerRef.current.scanFile(file, true);

      if (decodedText && onScan) {
        onScan(decodedText);
        toast.success("Scan ảnh thành công ✅");
      } else {
        toast.error("Không đọc được mã từ ảnh");
      }
    } catch (err) {
      console.error("File scan error:", err);
      toast.error("Không đọc được mã từ ảnh");
    } finally {
      setScanningFile(false);
      event.target.value = null;

      // Start lại camera sau khi xử lý xong file
      await startCamera();
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="flex flex-col gap-4">
      {/* CAMERA */}
      <div
        id="reader"
        style={{
          width: "100%",
          minHeight: "100%",
        }}
      />

      {/* BUTTON */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleFileClick}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500"
          disabled={scanningFile}
        >
          {scanningFile ? "Đang quét ảnh..." : "📁 Add file"}
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
