"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function Scanner({ onScan }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const lastScanRef = useRef(0);
  const fileInputRef = useRef(null);
  const isTransitioning = useRef(false); // 🔥 Biến khóa trạng thái
  const [scanningFile, setScanningFile] = useState(false);

  /* =========================
      START CAMERA
  ========================= */
  const startCamera = async () => {
    if (!scannerRef.current || isTransitioning.current) return;
    if (scannerRef.current.isScanning) return;

    isTransitioning.current = true; // Khóa lại
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          const now = Date.now();
          if (now - lastScanRef.current < 1500) return;
          lastScanRef.current = now;
          if (onScan) setTimeout(() => onScan(decodedText), 0);
        },
      );
    } catch (err) {
      console.error("Start camera error:", err);
    } finally {
      isTransitioning.current = false; // Mở khóa
    }
  };

  /* =========================
      STOP CAMERA
  ========================= */
  const stopCamera = async () => {
    if (!scannerRef.current || isTransitioning.current) return;
    if (!scannerRef.current.isScanning) return;

    isTransitioning.current = true;
    try {
      await scannerRef.current.stop();
    } catch (err) {
      console.log("Stop camera error:", err);
    } finally {
      isTransitioning.current = false;
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const init = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      scannerRef.current = new Html5Qrcode("reader");
      await startCamera();
    };

    init();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  /* =========================
      FILE SCAN logic
  ========================= */
  const handleFileClick = async () => {
    await stopCamera();

    const onFocusBack = () => {
      window.removeEventListener("focus", onFocusBack);

      // Đợi lâu hơn một chút để chắc chắn onChange không chạy
      setTimeout(async () => {
        // Chỉ bật lại cam nếu người dùng không chọn file nào
        if (!fileInputRef.current?.files?.length) {
          await startCamera();
        }
      }, 1000);
    };

    window.addEventListener("focus", onFocusBack);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    setScanningFile(true);
    try {
      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText && onScan) {
        onScan(decodedText);
        toast.success("Scan ảnh thành công ✅");
      }
    } catch (err) {
      toast.error("Không đọc được mã từ ảnh");
    } finally {
      setScanningFile(false);
      event.target.value = null;
      // Đợi dọn dẹp xong rồi mới start lại
      setTimeout(startCamera, 500);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div id="reader" style={{ width: "100%", minHeight: "100%" }} />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleFileClick}
          className="btn-file-scan" // Thay class CSS của bạn vào đây
          disabled={scanningFile}
        >
          {scanningFile ? "Đang quét..." : "📁 Add file"}
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
