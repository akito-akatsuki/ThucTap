"use client";

import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);

  const loadLogs = async () => {
    const res = await fetch("/api/import-log");
    const json = await res.json();
    setLogs(json.data || []);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <>
      <div style={page}>
        <h1 style={title}>📋 Import Logs</h1>

        <div style={card}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Product</th>
                <th style={th}>Quantity</th>
                <th style={th}>User</th>
                <th style={th}>Date</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={row}>
                  <td style={td}>{l.products?.name}</td>
                  <td style={td}>{l.quantity}</td>
                  <td style={td}>{l.created_by}</td>
                  <td style={td}>{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* STYLES */

const page = {
  padding: 40,
  background: "#f8fafc",
  minHeight: "100vh",
};

const title = {
  marginBottom: 30,
};

const card = {
  background: "white",
  padding: 25,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "center",
};

const th = {
  padding: 12,
  borderBottom: "2px solid #eee",
  fontWeight: 600,
};

const td = {
  padding: 12,
  borderBottom: "1px solid #eee",
};

const row = {
  transition: "0.2s",
};
