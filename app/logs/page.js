"use client";

import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    const res = await fetch("/api/log");
    const json = await res.json();
    setLogs(json.data || []);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  /* GROUP BY INVOICE */
  const grouped = logs.reduce((acc, item) => {
    const key = item.invoice_id;

    if (!acc[key]) {
      acc[key] = {
        invoice_id: key,
        created_at: item.invoices?.created_at,
        items: [],
      };
    }

    acc[key].items.push(item);
    return acc;
  }, {});

  /* FILTER SEARCH */
  const filtered = Object.values(grouped).filter((order) =>
    order.invoice_id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={page}>
      <h1 style={title}>📋 Orders</h1>

      {/* SEARCH */}
      <input
        style={input}
        placeholder="Search invoice..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* LIST */}
      {filtered.map((order) => {
        const shortId = order.invoice_id.slice(0, 8).toUpperCase();

        return (
          <div key={order.invoice_id} style={card}>
            <h3 style={invoice}>🧾 INV-{shortId}</h3>
            <p style={date}>{new Date(order.created_at).toLocaleString()}</p>

            <ul style={list}>
              {order.items.map((i) => (
                <li key={i.id} style={item}>
                  {i.products?.name} x{i.qty}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* STYLES */

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
