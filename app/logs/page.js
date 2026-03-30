"use client";

import { useEffect, useState } from "react";
import { formatVND } from "../utils/currency";

export default function StockLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState({});
  const [isDark, setIsDark] = useState(false);

  /* =========================
     DETECT DARK MODE
  ========================= */
  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark");

    setIsDark(checkDark());

    const observer = new MutationObserver(() => {
      setIsDark(checkDark());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  /* =========================
     LOAD LOGS
  ========================= */
  const loadLogs = async () => {
    try {
      const res = await fetch("/api/log");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  /* =========================
     SORT
  ========================= */
  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );

  /* =========================
      GROUP BY INVOICE
  ========================= */
  const grouped = sortedLogs.reduce((acc, log) => {
    const key = log.invoice_id || "no-invoice";

    if (!acc[key]) {
      // ✅ Lấy tên hiển thị từ API (đã fix ở bước trước)
      const displayName =
        log.creator_display ||
        (log.users ? `${log.users.name} (${log.users.email})` : "Hệ thống");

      acc[key] = {
        invoice_id: key,
        created_at: log.created_at,
        user: displayName, // Lưu tên thay vì UUID
        items: [],
        type: log.type,
      };
    }

    acc[key].items.push(log);
    return acc;
  }, {});

  /* =========================
     FILTER
  ========================= */
  const keyword = search.toLowerCase().trim();

  const filtered = Object.values(grouped).filter((order) => {
    if (!keyword) return true;

    return (
      (order.invoice_id || "").toLowerCase().includes(keyword) ||
      order.items.some((i) =>
        (i.products?.name || "").toLowerCase().includes(keyword),
      ) ||
      (order.user || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div style={getPageStyle(isDark)}>
      <h1 style={getTitleStyle(isDark)}>📦 Stock Movement Logs</h1>

      {/* SEARCH */}
      <input
        style={getInputStyle(isDark)}
        placeholder="Search product / invoice / user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* LIST */}
      {filtered.map((order) => {
        const shortId =
          order.invoice_id !== "no-invoice"
            ? order.invoice_id.slice(0, 8).toUpperCase()
            : "N/A";

        const isOpen = open[order.invoice_id];

        const total = order.items.reduce(
          (sum, i) => sum + i.quantity * (i.price || 0),
          0,
        );

        const date = order.created_at
          ? new Date(order.created_at).toLocaleString()
          : "No date";

        const isExport = order.type === "export";

        return (
          <div key={order.invoice_id} style={getCardStyle(isDark)}>
            {/* HEADER */}
            <div
              style={header}
              onClick={() =>
                setOpen((prev) => ({
                  ...prev,
                  [order.invoice_id]: !prev[order.invoice_id],
                }))
              }
            >
              <div>
                <h3 style={titleRow}>
                  <span
                    style={{
                      background: isExport ? "#ef4444" : "#22c55e",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  >
                    🧾 INV-{shortId}
                  </span>

                  <span style={{ fontSize: 14, color: "#64748b" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </h3>

                {/* ✅ Hiển thị tên/email người dùng thay vì UUID */}
                <p style={getMetaStyle(isDark)}>👤 {order.user}</p>
                <p style={getMetaStyle(isDark)}>🕒 {date}</p>
              </div>

              <div style={getTotalStyle(isDark)}>💰 {formatVND(total)}</div>
            </div>

            {/* DROPDOWN */}
            {isOpen && (
              <div style={getDropdownStyle(isDark)}>
                {order.items.map((i) => (
                  <div key={i.id} style={row}>
                    <span>{i.products?.name || "Unknown"}</span>

                    <span
                      style={{
                        color: i.type === "export" ? "#ef4444" : "#22c55e",
                        fontWeight: 500,
                      }}
                    >
                      {i.type === "export" ? "📦 Export" : "📥 Import"}
                    </span>

                    <span>x{i.quantity}</span>

                    <span style={{ textAlign: "right" }}>
                      {formatVND(i.price || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================
   STYLES (DARK MODE SUPPORT)
========================= */

const getPageStyle = (dark) => ({
  padding: 40,
  minHeight: "100vh",
  background: dark ? "#020617" : "#f8fafc",
  color: dark ? "#e2e8f0" : "#0f172a",
});

const getTitleStyle = (dark) => ({
  marginBottom: 20,
});

const getInputStyle = (dark) => ({
  padding: 10,
  marginBottom: 20,
  width: "100%",
  maxWidth: 320,
  borderRadius: 8,
  border: "1px solid " + (dark ? "#334155" : "#ddd"),
  background: dark ? "#1e293b" : "white",
  color: dark ? "white" : "black",
});

const getCardStyle = (dark) => ({
  background: dark ? "#1e293b" : "white",
  padding: 20,
  borderRadius: 12,
  marginBottom: 15,
  boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.05)",
});

const header = {
  display: "flex",
  justifyContent: "space-between",
  cursor: "pointer",
};

const titleRow = {
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const getMetaStyle = (dark) => ({
  fontSize: 12,
  color: dark ? "#94a3b8" : "#666",
  margin: "2px 0",
});

const getDropdownStyle = (dark) => ({
  marginTop: 10,
  borderTop: "1px solid " + (dark ? "#334155" : "#eee"),
  paddingTop: 10,
});

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  gap: "10px",
  padding: "6px 0",
  alignItems: "center",
};

const getTotalStyle = (dark) => ({
  fontWeight: "bold",
  color: dark ? "#4ade80" : "#16a34a",
});
