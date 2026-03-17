"use client";

import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    const res = await fetch("/api/log");
    const json = await res.json();

    console.log("🔥 DATA:", json);

    setLogs(json.data || []);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  /* =========================
     SORT THEO NGÀY
  ========================= */

  const safeLogs = (logs || []).sort(
    (a, b) =>
      new Date(b.invoices?.created_at || 0) -
      new Date(a.invoices?.created_at || 0),
  );

  /* =========================
     GROUP BY INVOICE
  ========================= */

  const grouped = safeLogs.reduce((acc, item) => {
    const key = item.invoice_id;
    if (!key) return acc;

    if (!acc[key]) {
      acc[key] = {
        invoice_id: key,
        created_at: item.invoices?.created_at,
        user_name:
          item.invoices?.users?.name ||
          item.invoices?.created_name ||
          item.invoices?.users?.email ||
          "Unknown",
        items: [],
      };
    }

    acc[key].items.push(item);
    return acc;
  }, {});

  /* =========================
     FILTER
  ========================= */

  const filtered = Object.values(grouped).filter((order) =>
    (order.invoice_id || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={page}>
      <h1 style={title}>📋 Orders</h1>

      <input
        style={input}
        placeholder="Search invoice..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.map((order) => {
        const shortId = order.invoice_id.slice(0, 8).toUpperCase();

        const total = order.items.reduce((sum, i) => sum + i.qty * i.price, 0);

        return (
          <div key={order.invoice_id} style={card}>
            <h3 style={invoice}>🧾 INV-{shortId}</h3>

            {/* 👤 USER */}
            <p style={user}>👤 {order.user_name}</p>

            {/* 🕒 DATE */}
            <p style={date}>
              {order.created_at
                ? new Date(order.created_at).toLocaleString()
                : "No date"}
            </p>

            <ul style={list}>
              {order.items.map((i) => (
                <li key={i.id} style={item}>
                  {i.products?.name} x{i.qty} — {i.price.toLocaleString()}đ
                </li>
              ))}
            </ul>

            <p style={totalStyle}>💰 Total: {total.toLocaleString()}đ</p>
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

const invoice = {
  marginBottom: 5,
};

const user = {
  fontSize: 14,
  fontWeight: "bold",
  color: "#2563eb",
  marginBottom: 5,
};

const date = {
  fontSize: 12,
  color: "#666",
  marginBottom: 10,
};

const list = {
  paddingLeft: 20,
};

const item = {
  marginBottom: 5,
};

const totalStyle = {
  marginTop: 10,
  fontWeight: "bold",
  color: "#16a34a",
};
