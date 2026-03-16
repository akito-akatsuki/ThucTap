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
import InputModal from "@/components/InputModal";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [chart, setChart] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qr, setQr] = useState(null);
  const [role, setRole] = useState(null);

  const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f59e0b"];

  /* LOAD PRODUCTS */

  const loadProducts = async () => {
    const res = await fetch("/api/products");
    const json = await res.json();

    const list = json.data || [];

    setProducts(list);

    loadAI(list);
  };
  /* LOAD CATEGORIES */

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    setCategories(json.data || []);
  };

  /* SHOW QR */

  const showQR = (barcode) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${barcode}`;
    window.open(url);
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
    loadProducts();
    loadCategories();
  }, []);

  /* REALTIME */

  useEffect(() => {
    const channel = supabase
      .channel("inventory-realtime")

      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        loadProducts,
      )

      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory" },
        loadProducts,
      )

      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales" },
        loadProducts,
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    if (!name.trim()) {
      toast.error("Enter product name");
      return;
    }

    if (!price) {
      toast.error("Enter price");
      return;
    }

    if (isNaN(price)) {
      toast.error("Price must be a number");
      return;
    }

    const loading = toast.loading("Adding product...");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          category_id: category || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        toast.dismiss(loading);
        toast.error(json.error || "Add failed");
        return;
      }

      setQr(json.qr);

      setName("");
      setPrice("");

      toast.dismiss(loading);
      toast.success("Product added");

      loadProducts();
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Server error");
    }
  };

  /*ADD CATEGORY */
  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Enter category name");
      return;
    }

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newCategory,
      }),
    });

    const json = await res.json();

    if (json.error) {
      toast.error(json.error);
      return;
    }

    toast.success("Category added");

    setNewCategory("");
    loadCategories();
  };
  /* DELETE */

  const deleteProduct = (id) => {
    setConfirmModal(id);
  };
  const confirmDelete = async () => {
    await fetch("/api/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: confirmModal }),
    });

    toast.success("Product deleted");

    setConfirmModal(null);
    loadProducts();
  };
  /* EDIT PRODUCT */

  const editProduct = (product) => {
    setModal({
      type: "edit",
      product,
    });
  };

  /* IMPORT STOCK */

  const importStock = (product) => {
    setModal({
      type: "import",
      product,
    });
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
        {role === "admin" && (
          <Card title="Add Product">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addProduct();
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={input}
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={input}
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={input}
                >
                  <option value="">Category</option>

                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button type="submit" style={primaryBtn}>
                  Add
                </button>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <input
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={input}
                />

                <button onClick={addCategory} style={primaryBtn}>
                  Add Category
                </button>
              </div>
            </form>
          </Card>
        )}
        {/* PRODUCTS */}

        <Card title="Products">
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Product</th>
                <th style={th}>Category</th>
                <th style={th}>Price</th>
                <th style={th}>Stock</th>
                <th style={th}>Status</th>
                <th style={th}>QR</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => {
                const stock = p.inventory?.stock || 0;
                const min = p.min_stock || 5;

                let status = "OK";
                let color = "#16a34a";

                if (stock === 0) {
                  status = "Out";
                  color = "#dc2626";
                } else if (stock <= min) {
                  status = "Low";
                  color = "#f59e0b";
                }

                return (
                  <tr key={p.id} style={row}>
                    <td style={td}>{p.name}</td>
                    <td style={td}>{p.categories?.name || "-"}</td>
                    <td style={td}>{p.price} VNĐ</td>

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
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: color,
                          color: "white",
                        }}
                      >
                        {status}
                      </span>
                    </td>

                    <td style={td}>
                      <button onClick={() => showQR(p.barcode)} style={qrBtn}>
                        QR
                      </button>
                    </td>

                    <td style={td}>
                      <div style={actionGroup}>
                        <button
                          onClick={() => importStock(p)}
                          disabled={!(role === "admin")}
                          style={{
                            ...greenBtn,
                            opacity:
                              role === "admin" || role === "seller" ? 1 : 0.4,
                          }}
                        >
                          Import
                        </button>

                        <button
                          onClick={() => editProduct(p)}
                          disabled={role !== "admin"}
                          style={{
                            ...editBtn,
                            opacity: role === "admin" ? 1 : 0.4,
                            cursor:
                              role === "admin" ? "pointer" : "not-allowed",
                          }}
                        >
                          Edit
                        </button>

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
                      </div>
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

      {modal && (
        <InputModal
          type={modal.type}
          product={modal.product}
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            if (modal.type === "edit") {
              await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: modal.product.id,
                  name: data.name,
                  price: Number(data.price),
                  min_stock: Number(data.min_stock),
                  category_id: data.category_id,
                }),
              });

              toast.success("Product updated");
            }

            if (modal.type === "import") {
              await fetch("/api/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  product_id: modal.product.id,
                  quantity: Number(data.qty),
                }),
              });

              toast.success("Stock imported");
            }

            setModal(null);
            loadProducts();
          }}
        />
      )}
      {confirmModal && (
        <ConfirmModal
          text="Delete this product?"
          onCancel={() => setConfirmModal(null)}
          onConfirm={confirmDelete}
        />
      )}

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

const page = { padding: 40, background: "#f8fafc", minHeight: "100vh" };
const title = { marginBottom: 30 };

const statsRow = { display: "flex", gap: 20, marginBottom: 30 };

const statCard = { background: "white", padding: 20, borderRadius: 10 };

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

const th = { padding: 12, borderBottom: "2px solid #eee" };
const td = { padding: 12, borderBottom: "1px solid #eee" };

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

const editBtn = {
  background: "#f59e0b",
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

const qrBtn = {
  background: "#6366f1",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};

const actionGroup = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
};
