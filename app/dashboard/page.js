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
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { formatVND } from "../utils/currency";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [chart, setChart] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [revenue, setRevenue] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [chartCategory, setChartCategory] = useState("");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qr, setQr] = useState(null);
  const [role, setRole] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f59e0b"];

  /* ===== Responsive Detection ===== */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ===== Load Products ===== */
  const loadProducts = async () => {
    const res = await fetch("/api/products");
    const json = await res.json();
    const list = json.data || [];
    setProducts(list);
    loadAI(list);
  };

  /* ===== Load Categories ===== */
  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    setCategories(json.data || []);
  };

  /* ===== Load AI Predictions ===== */
  const loadAI = async (productList) => {
    if (!productList.length) return;

    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  /*==== UI category====*/
  function CategoryDropdown({ categories, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const selected = categories.find((c) => c.id === value);

    return (
      <div className="relative flex-1 min-w-0">
        {/* Button */}
        <div
          onClick={() => setOpen(!open)}
          style={{
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "8px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              display: "block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selected ? selected.name : placeholder}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Options */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              maxHeight: 200,
              overflowY: "auto",
              border: "1px solid #ccc",
              borderRadius: 6,
              background: "#fff",
              zIndex: 10,
            }}
          >
            {categories.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  /* ===== Delete Category ===== */
  const deleteCategory = async (id) => {
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok && !json.error) {
        toast.success(json.message || "Category deleted, products are kept");
        setSelectedCategory("");
        loadCategories();
        loadProducts();
      } else {
        toast.error(json.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  /* ===== Show QR ===== */
  const showQR = (barcode) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${barcode}`;
    window.open(url);
  };

  /* ===== Add Product ===== */
  const addProduct = async () => {
    if (!name.trim()) return toast.error("Enter product name");
    if (!price) return toast.error("Enter price");
    if (isNaN(price)) return toast.error("Price must be a number");

    const loading = toast.loading("Adding product...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          category_id: category || null,
          user: session?.user,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        toast.dismiss(loading);
        return toast.error(json.error || "Add failed");
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

  /* ===== Add Category ===== */
  const addCategory = async () => {
    if (!newCategory.trim()) return toast.error("Enter category name");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    const json = await res.json();
    if (json.error) return toast.error(json.error);
    toast.success("Category added");
    setNewCategory("");
    loadCategories();
  };

  /* ===== Delete Product ===== */
  const deleteProduct = (id) => setConfirmModal(id);
  const confirmDelete = async () => {
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: confirmModal }),
    });
    toast.success("Product deleted");
    setConfirmModal(null);
    loadProducts();
  };

  /* ===== Edit & Import Stock ===== */
  const editProduct = (product) => setModal({ type: "edit", product });
  const importStock = (product) => setModal({ type: "import", product });

  /* ===== Load Revenue ===== */
  const loadRevenue = async () => {
    try {
      let url = "/api/revenue";
      const params = [];
      if (selectedYear) params.push(`year=${selectedYear}`);
      if (selectedMonth) params.push(`month=${selectedMonth}`);
      if (params.length) url += "?" + params.join("&");
      const res = await fetch(url);
      const data = await res.json();
      setRevenue(
        data.map((item) => ({
          month: `${item.year}-${String(item.month).padStart(2, "0")}`,
          total_revenue: Number(item.total_revenue),
        })),
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* ===== Get User Role ===== */
  useEffect(() => {
    const getRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) return;
      const res = await fetch(`/api/users?email=${email}`);
      const json = await res.json();
      setRole(json.role);
    };
    getRole();
  }, []);

  /* ===== Realtime Stock Updates ===== */
  useEffect(() => {
    const channel = supabase
      .channel("inventory-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stock_movements",
        },
        () => loadProducts(),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  /* ===== Filtered Products ===== */
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalStock = products.reduce(
    (sum, p) => sum + (p.inventory?.stock || 0),
    0,
  );

  /* ===== Init ===== */
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadRevenue();
  }, []);

  useEffect(() => {
    const filtered = chartCategory
      ? products.filter((p) => p.category_id === chartCategory)
      : products;
    loadAI(filtered);
  }, [chartCategory]);

  /* ===== Custom Tooltip ===== */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            position: "absolute",
            zIndex: 9999,
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{label}</div>
          {payload.map((p) => (
            <div key={p.name} style={{ color: p.stroke, marginBottom: 2 }}>
              {p.name}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  /* ===== Render ===== */
  return (
    <>
      <div style={{ padding: 16, maxWidth: 1400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
          📦 Inventory Dashboard
        </h1>

        {/* STATS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard title="Total Products" value={products.length} />
          <StatCard title="Total Stock" value={totalStock} />
        </div>

        {/* === MANAGE PRODUCTS & CATEGORIES === */}
        {role === "admin" && !isMobile && (
          <Card title="Manage Products & Categories">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addProduct();
              }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* === Row 1: Add Product === */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                {/* Inputs */}
                <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                  <input
                    placeholder="Product name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      minWidth: 0,
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 6,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      minWidth: 0,
                    }}
                  />
                  <CategoryDropdown
                    categories={categories}
                    value={category}
                    onChange={setCategory}
                    placeholder="Category"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                </div>

                {/* Button */}
                <button
                  type="submit"
                  style={{
                    flex: isMobile ? "0 0 80px" : "0 0 120px",
                    padding: isMobile ? "4px 8px" : "8px 16px",
                    fontSize: isMobile ? 12 : 14,
                    borderRadius: 6,
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Add Product
                </button>
              </div>

              {/* === Row 2: Add Category === */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <input
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    flex: 1,
                    padding: 6,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    minWidth: 0,
                  }}
                />
                <button
                  type="button"
                  onClick={addCategory}
                  style={{
                    flex: isMobile ? "0 0 80px" : "0 0 120px",
                    padding: isMobile ? "4px 8px" : "8px 16px",
                    fontSize: isMobile ? 12 : 14,
                    borderRadius: 6,
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Add Category
                </button>
              </div>

              {/* === Row 3: Delete Category === */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <CategoryDropdown
                  categories={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Select Category to Delete"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedCategory)
                      return toast.error("Select category");
                    deleteCategory(selectedCategory);
                  }}
                  style={{
                    flex: isMobile ? "0 0 80px" : "0 0 120px",
                    padding: isMobile ? "4px 8px" : "8px 16px",
                    fontSize: isMobile ? 12 : 14,
                    borderRadius: 6,
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Delete
                </button>
              </div>
            </form>
          </Card>
        )}
        {/* === MOBILE VERSION ONLY === */}
        {isMobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* --- Add Product --- */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              />
              <CategoryDropdown
                categories={categories}
                value={category}
                onChange={setCategory}
                placeholder="Category"
              />
              <button
                onClick={addProduct}
                style={{
                  ...primaryBtn,
                  width: "100%",
                  padding: 8,
                  fontSize: 14,
                }}
              >
                Add Product
              </button>
            </div>

            {/* --- Add/Delete Category --- */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                }}
              />
              <button
                onClick={addCategory}
                style={{ ...greenBtn, width: "100%", padding: 8, fontSize: 14 }}
              >
                Add Category
              </button>

              <CategoryDropdown
                categories={categories}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Select Category to Delete"
              />
              <button
                onClick={() => {
                  if (!selectedCategory) return toast.error("Select category");
                  deleteCategory(selectedCategory);
                }}
                style={{
                  ...deleteBtn,
                  width: "100%",
                  padding: 8,
                  fontSize: 14,
                }}
              >
                Delete Category
              </button>
            </div>

            {/* --- Products List --- */}
          </div>
        )}
        {/* PRODUCTS TABLE */}
        <Card title={null}>
          {" "}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              Products
            </h3>
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: 6,
                borderRadius: 6,
                border: "1px solid var(--border)",
                minWidth: 200,
              }}
            />
          </div>
          {/* Desktop Table */}
          {!isMobile && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                  tableLayout: "fixed", // ✅ important để cột đều nhau
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Product</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Stock</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>QR</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
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
                      <tr key={p.id}>
                        <td style={tdStyle}>{p.name}</td>
                        <td style={tdStyle}>{p.categories?.name || "-"}</td>
                        <td style={tdStyle}>{formatVND(p.price || 0)}</td>
                        <td style={tdStyle}>
                          <span style={stockStyle(stock)}>{stock}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ ...statusStyle, background: color }}>
                            {status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => showQR(p.barcode)}
                            style={qrBtn}
                          >
                            QR
                          </button>
                        </td>
                        <td style={tdStyle}>
                          <div style={actionWrapper}>
                            <button
                              onClick={() => importStock(p)}
                              disabled={role !== "admin"}
                              style={{ ...greenBtn, fontSize: 12 }}
                            >
                              Import
                            </button>
                            <button
                              onClick={() => editProduct(p)}
                              disabled={role !== "admin"}
                              style={{ ...editBtn, fontSize: 12 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              disabled={role !== "admin"}
                              style={{ ...deleteBtn, fontSize: 12 }}
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
            </div>
          )}
          {/* Mobile Card */}
          {isMobile && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredProducts.map((p) => {
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
                  <div
                    key={p.id}
                    style={{
                      padding: 12,
                      border: "1px solid #eee",
                      borderRadius: 10,
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <strong>{p.name}</strong>
                      <button onClick={() => showQR(p.barcode)} style={qrBtn}>
                        QR
                      </button>
                    </div>
                    <div>Category: {p.categories?.name || "-"}</div>
                    <div>Price: {formatVND(p.price || 0)}</div>
                    <div>
                      Stock:{" "}
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: stock === 0 ? "#fee2e2" : "#dcfce7",
                          color: stock === 0 ? "#dc2626" : "#166534",
                        }}
                      >
                        {stock}
                      </span>
                    </div>
                    <div>
                      Status:{" "}
                      <span style={{ color, fontSize: 12 }}>{status}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        marginTop: 4,
                      }}
                    >
                      <button
                        onClick={() => importStock(p)}
                        disabled={role !== "admin"}
                        style={{ ...greenBtn, fontSize: 12 }}
                      >
                        Import
                      </button>
                      <button
                        onClick={() => editProduct(p)}
                        disabled={role !== "admin"}
                        style={{ ...editBtn, fontSize: 12 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        disabled={role !== "admin"}
                        style={{ ...deleteBtn, fontSize: 12 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* REVENUE CHART */}
        <Card title="Monthly Revenue">
          <div
            style={{
              width: "100%",
              height: 300,
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenue}
                margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value) => formatVND(value)} />
                <Legend wrapperStyle={{ bottom: -10 }} />
                <Line
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI PREDICTIONS */}
        <Card title="AI Predictions">
          {/* FILTER */}
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <select
              value={chartCategory}
              onChange={(e) => setChartCategory(e.target.value)}
              style={{ padding: 6, borderRadius: 6 }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* CHART */}
          <div
            style={{
              width: "100%",
              height: 300,
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              style={{ overflow: "visible" }}
            >
              <LineChart
                data={chart.slice(0, 7)} // ✅ luôn 7 ngày
                margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  interval={0}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{
                    maxHeight: 40,
                    overflow: "visible",
                    whiteSpace: "normal",
                  }}
                />
                {predictions.map((p, i) => (
                  <Line
                    key={p.name}
                    dataKey={p.name}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        {/* Modals */}
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
                const {
                  data: { session },
                } = await supabase.auth.getSession();
                await fetch("/api/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    product_id: modal.product.id,
                    quantity: Number(data.qty),
                    user: session?.user,
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
      </div>
    </>
  );
}

/* ===== COMPONENTS ===== */
function Card({ title, children }) {
  return (
    <div
      style={{
        background: "var(--card)",
        padding: 25,
        borderRadius: 12,
        marginBottom: 30,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {title && <h3 style={{ marginBottom: 20 }}>{title}</h3>}
      {children}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{ background: "var(--card)", padding: 20, borderRadius: 10 }}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

/* ===== BUTTON STYLES ===== */
const primaryBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
  borderRadius: 6,
};
const greenBtn = {
  background: "#16a34a",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
};
const deleteBtn = {
  background: "#dc2626",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
};
const editBtn = {
  background: "#f59e0b",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
};
const qrBtn = {
  background: "#6366f1",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer",
};
/*====table style====*/
const thStyle = {
  padding: 10,
  borderBottom: "2px solid var(--border)",
  textAlign: "left",
};
const tdStyle = {
  padding: 8,
  textAlign: "left",
  verticalAlign: "middle", // ✅ đảm bảo dòng cao bằng nhau
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const stockStyle = (stock) => ({
  padding: "2px 8px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  background: stock === 0 ? "#fee2e2" : "#dcfce7",
  color: stock === 0 ? "#dc2626" : "#166534",
  display: "inline-block",
  minWidth: 24,
  textAlign: "center",
});
const statusStyle = {
  padding: "4px 10px",
  borderRadius: 20,
  color: "#fff",
  fontSize: 12,
  display: "inline-block",
  textAlign: "center",
};
const actionWrapper = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  justifyContent: "flex-start", // ✅ giữ tất cả button bên trái, không lạc cột
};
