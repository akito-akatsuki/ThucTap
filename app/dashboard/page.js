"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

import AIBot from "@/components/AIBot";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [chart, setChart] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [role, setRole] = useState(null);

  const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f59e0b"];

  /* LOAD PRODUCTS */

  const loadProducts = async () => {
    const res = await fetch("/api/products");
    const json = await res.json();
    setProducts(json.data || []);
  };

  /* LOAD AI */

  const loadAI = async (productList) => {
    if (!productList.length) return;

    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products: productList }),
      });

      const json = await res.json();

      const ai = json.data || [];

      setPredictions(ai);

      const today = new Date();

      const formatted = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const row = { date: label };

        ai.forEach((p) => {
          row[p.name] = p.prediction?.[i] ?? 0;
        });

        return row;
      });

      setChart(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  /* INIT */

  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/products");
      const json = await res.json();

      const productList = json.data || [];

      setProducts(productList);

      loadAI(productList);
    };

    init();
  }, []);

  /* GET ROLE */

  useEffect(() => {
    const getRole = async () => {
      const { data: session } = await supabase.auth.getSession();

      const email = session?.session?.user?.email;

      if (!email) return;

      const res = await fetch(`/api/users?email=${email}`);
      const json = await res.json();

      setRole(json.role);
    };

    getRole();
  }, []);

  /* ADD PRODUCT */

  const addProduct = async () => {
    if (!name || !price) return alert("Enter product info");

    await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        price: Number(price),
      }),
    });

    setName("");
    setPrice("");

    loadProducts();
  };

  /* DELETE PRODUCT */

  const deleteProduct = async (id) => {
    const confirmDelete = confirm("Delete this product permanently?");

    if (!confirmDelete) return;

    await fetch("/api/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
      }),
    });

    loadProducts();
  };

  /* IMPORT STOCK */

  const importStock = async (id) => {
    const qty = prompt("Enter quantity");

    if (!qty) return;

    const res = await fetch("/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: id,
        quantity: Number(qty),
        user: "admin", // 🔥 thêm dòng này
      }),
    });

    const data = await res.json();
    console.log(data);

    loadProducts(); // reload stock
  };

  const totalStock = products.reduce(
    (sum, p) => sum + (p.inventory?.stock || 0),
    0,
  );

  return (
    <>
      <div style={page}>
        <h1 style={title}>📦 Inventory Dashboard</h1>

        {/* STATS */}

        <div style={statsRow}>
          <StatCard title="Total Products" value={products.length} />
          <StatCard title="Total Stock" value={totalStock} />
        </div>

        {/* ADD PRODUCT */}

        <Card title="Add Product">
          <div style={{ display: "flex", gap: 10 }}>
            <input
              placeholder="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={input}
            />

            <input
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={input}
            />

            <button onClick={addProduct} style={primaryBtn}>
              Add
            </button>
          </div>
        </Card>

        {/* PRODUCTS */}

        <Card title="Products">
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Product</th>
                <th style={th}>Price</th>
                <th style={th}>Stock</th>
                <th style={th}>Import</th>
                <th style={th}>Delete</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => {
                const stock = p.inventory?.stock || 0;

                return (
                  <tr key={p.id} style={row}>
                    <td style={td}>{p.name}</td>

                    <td style={td}>${p.price}</td>

                    <td style={td}>
                      <span
                        style={{
                          ...stockBadge,
                          background: stock === 0 ? "#fee2e2" : "#dcfce7",
                          color: stock === 0 ? "#dc2626" : "#166534",
                        }}
                      >
                        {stock}
                      </span>
                    </td>

                    <td style={td}>
                      <button
                        onClick={() => importStock(p.id)}
                        disabled={role !== "seller" && role !== "admin"}
                        style={{
                          ...greenBtn,
                          opacity:
                            role === "seller" || role === "admin" ? 1 : 0.4,
                        }}
                      >
                        Import
                      </button>
                    </td>

                    <td style={td}>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        disabled={role !== "admin"}
                        style={{
                          ...deleteBtn,
                          opacity: role === "admin" ? 1 : 0.4,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* AI TABLE */}

        <Card title="AI Prediction Insights">
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Product</th>
                <th style={th}>Predicted Today</th>
                <th style={th}>Avg Daily Sales</th>
                <th style={th}>Out of Stock</th>
              </tr>
            </thead>

            <tbody>
              {predictions.map((p, i) => (
                <tr key={i}>
                  <td style={td}>{p.name}</td>
                  <td style={td}>{p.prediction?.[0] ?? 0}</td>
                  <td style={td}>{p.predictedSales ?? 0}</td>
                  <td style={td}>{p.daysLeft ?? "-"} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* CHART */}

        <Card title="AI Sales Prediction (Next 7 Days)">
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />

                {predictions.map((p, i) => (
                  <Line
                    key={i}
                    dataKey={p.name}
                    stroke={colors[i % colors.length]}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <AIBot />
    </>
  );
}

/* COMPONENTS */

function Card({ title, children }) {
  return (
    <div style={card}>
      {title && <h3 style={cardTitle}>{title}</h3>}
      {children}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={statCard}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* STYLES */

const page = {
  padding: 40,
  background: "#f8fafc",
  minHeight: "100vh",
};

const title = { marginBottom: 30 };

const statsRow = {
  display: "flex",
  gap: 20,
  marginBottom: 30,
};

const statCard = {
  background: "white",
  padding: 20,
  borderRadius: 10,
};

const card = {
  background: "white",
  padding: 25,
  borderRadius: 12,
  marginBottom: 30,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const cardTitle = { marginBottom: 20 };

const table = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "center",
};

const th = {
  padding: 12,
  borderBottom: "2px solid #eee",
};

const td = {
  padding: 12,
  borderBottom: "1px solid #eee",
};

const input = {
  padding: 8,
  border: "1px solid #ddd",
  borderRadius: 6,
};

const primaryBtn = {
  background: "#2563eb",
  color: "white",
  padding: "8px 16px",
  border: "none",
  borderRadius: 6,
};

const greenBtn = {
  background: "#16a34a",
  color: "white",
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
};

const deleteBtn = {
  background: "#dc2626",
  color: "white",
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
};

const row = { transition: "0.2s" };

const stockBadge = {
  padding: "4px 10px",
  borderRadius: 20,
  fontWeight: 600,
  fontSize: 14,
};
