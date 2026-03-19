"use client";

import { useEffect, useState } from "react";
import { formatVND } from "../utils/currency";

export default function StockLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState({});

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
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );

  /* =========================
     GROUP BY INVOICE
  ========================= */
  const grouped = sortedLogs.reduce((acc, log) => {
    const key = log.invoice_id || "no-invoice";

    if (!acc[key]) {
      acc[key] = {
        invoice_id: key,
        created_at: log.created_at,
        user: log.created_by || "POS",
        items: [],
        type: log.type, // 👈 LẤY TYPE NGAY TỪ LOG ĐẦU TIÊN
      };
    }

    acc[key].items.push(log);
    return acc;
  }, {});

  /* =========================
     FILTER
  ========================= */
  const filtered = Object.values(grouped).filter((order) => {
    const keyword = search.toLowerCase();

    return (
      // 🔍 invoice
      (order.invoice_id || "").toLowerCase().includes(keyword) ||
      // 🔍 product name
      order.items.some((i) =>
        (i.products?.name || "").toLowerCase().includes(keyword),
      ) ||
      // 🔍 user display name / email
      (order.user || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div style={page}>
      <h1 style={title}>📦 Stock Movement Logs</h1>

      {/* SEARCH */}
      <input
        style={input}
        placeholder="Search product or invoice..."
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

        // ✅ LOGIC ĐƠN GIẢN: chỉ cần check type
        const isExport = order.type === "export";

        return (
          <div key={order.invoice_id} style={card}>
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
                <h3
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
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

                <p style={meta}>👤 {order.user}</p>
                <p style={meta}>🕒 {date}</p>
              </div>

              <div style={totalStyle}>💰 {formatVND(total)}</div>
            </div>

            {/* DROPDOWN */}
            {isOpen && (
              <div style={dropdown}>
                {order.items.map((i) => (
                  <div
                    key={i.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      gap: "10px",
                      padding: "6px 0",
                      alignItems: "center",
                    }}
                  >
                    <span>{i.products?.name || "Unknown"}</span>

                    <span>
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
   STYLES
========================= */

const page = {
  padding: 40,
  background: "#f8fafc",
  minHeight: "100vh",
};

const title = {
  marginBottom: 20,
};

const input = {
  padding: 10,
  marginBottom: 20,
  width: "100%",
  maxWidth: 300,
  borderRadius: 8,
  border: "1px solid #ddd",
};

const card = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  marginBottom: 15,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  cursor: "pointer",
};

const meta = {
  fontSize: 12,
  color: "#666",
  margin: "2px 0",
};

const dropdown = {
  marginTop: 10,
  borderTop: "1px solid #eee",
  paddingTop: 10,
};

const totalStyle = {
  fontWeight: "bold",
  color: "#16a34a",
};
