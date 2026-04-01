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
import {
  Package,
  Layers,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import AIBot from "@/components/AIBot";
import InputModal from "@/components/InputModal";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { formatVND } from "../utils/currency";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [productCategory, setProductCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState("");
  const [revenue, setRevenue] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openManage, setOpenManage] = useState(false);
  const router = useRouter();

  const canManage = role && role !== "staff";

  // Auth protection
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      }
    });
  }, [router]);

  // Load functions
  const loadProducts = async (silent = false) => {
    if (!silent) setLoading(true); // Chỉ hiện skeleton nếu không phải update ngầm
    const res = await fetch("/api/products");
    const json = await res.json();
    setProducts(json.data || []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    setCategories(json.data || []);
  };

  const loadRevenue = async () => {
    try {
      const res = await fetch("/api/revenue");
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

  // Category Dropdown
  // Actions
  const deleteCategory = async (id) => {
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok && !json.error) {
        toast.success("Category deleted");
        setCategoryToDelete("");
        loadCategories();
        loadProducts();
      } else {
        toast.error(json.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const showQR = (barcode) =>
    window.open(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${barcode}`,
      "_blank",
    );

  const addProduct = async () => {
    if (!name.trim()) return toast.error("Enter product name");
    if (!price) return toast.error("Enter price");
    if (isNaN(price)) return toast.error("Price must be a number");

    const loadingToast = toast.loading("Adding...");
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
          category_id: productCategory || null,
          user: session?.user,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        toast.error(json.error || "Add failed");
      } else {
        setName("");
        setPrice("");
        setProductCategory("");
        toast.success("Product added");
        loadProducts();
      }
    } catch (err) {
      toast.error("Server error");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

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

  const editProduct = (product) => setModal({ type: "edit", product });
  const importStock = (product) => setModal({ type: "import", product });

  // Effects
  useEffect(() => {
    const getRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const res = await fetch(`/api/users?id=${userId}`);
      const json = await res.json();
      setRole(json.role ?? null);
    };
    getRole();
  }, []);

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
        () => loadProducts(true), // ✅ Thêm true để load không hiện skeleton
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [products.length]); // Thêm dependency để đảm bảo channel luôn lắng nghe đúng

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (!filterCategory || p.category_id === filterCategory),
  );
  const totalStock = products.reduce(
    (sum, p) => sum + (p.inventory?.stock || 0),
    0,
  );

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadRevenue();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-black/80 text-white p-3 rounded-xl text-xs pointer-events-none whitespace-nowrap shadow-2xl border border-white/20">
          <div className="font-bold mb-2">{label}</div>
          {payload.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2"
              style={{ color: p.stroke }}
            >
              • {p.name}: {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusClass = (stock, min = 5) => {
    if (stock === 0) return { label: "Out", className: "status-out" };
    if (stock <= min) return { label: "Low", className: "status-low" };
    return { label: "OK", className: "status-ok" };
  };

  if (loading) {
    return (
      <div className="dashboard-page space-y-8">
        <div className="flex items-center gap-4">
          <div className="skeleton-title" />
          <div className="w-12 h-12 skeleton rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card p-6">
              <div className="skeleton-text" />
              <div className="skeleton h-12 w-24 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page smooth-scroll-page min-h-screen space-y-10 px-4 md:px-6 pb-10">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              📦 Inventory Dashboard
            </h1>
            <p className="text-gray-500 dark:text-slate-300 mt-2 text-lg">
              Manage products, stock & revenue in real-time
            </p>
          </div>
          <div className="hidden md:block text-6xl opacity-20">📊</div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Products",
            value: products.length,
            icon: <Package />,
            color: "from-blue-500 to-blue-600",
          },
          {
            title: "Stock",
            value: totalStock,
            icon: <Layers />,
            color: "from-emerald-500 to-emerald-600",
          },
          {
            title: "Avg Price",
            value: formatVND(
              products.reduce((s, p) => s + (p.price || 0), 0) /
                Math.max(products.length, 1),
            ),
            icon: <DollarSign />,
            color: "from-orange-500 to-amber-500",
          },
          {
            title: "Low Stock",
            value: products.filter(
              (p) => (p.inventory?.stock || 0) <= (p.min_stock || 5),
            ).length,
            icon: <TrendingUp />,
            color: "from-pink-500 to-purple-500",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition"
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r ${item.color} text-white mb-4`}
            >
              {item.icon}
            </div>
            <div className="text-gray-500 dark:text-slate-400 text-sm">
              {item.title}
            </div>
            <div className="text-2xl font-bold mt-1 dark:text-white">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* MANAGEMENT */}
      {canManage && (
        <div className="rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl overflow-visible relative z-10">
          {/* HEADER CLICK */}
          <div
            onClick={() => setOpenManage(!openManage)}
            className="flex items-center justify-between p-6 cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <h2 className="text-2xl font-bold flex items-center gap-2">
              ⚙️ Manage Products
            </h2>

            {/* ICON */}
            <div
              className={`transition-transform duration-300 ${
                openManage ? "rotate-180" : ""
              }`}
            >
              ▼
            </div>
          </div>

          {/* CONTENT */}
          <div
            className={`transition-all duration-300 ${
              openManage
                ? "max-h-[1000px] p-6 pt-0 opacity-100 pointer-events-auto"
                : "max-h-0 p-0 opacity-0 pointer-events-none"
            } overflow-hidden`}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addProduct();
              }}
              className="grid md:grid-cols-3 gap-4"
            >
              <input
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="form-input"
              />
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="form-input"
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button className="btn-primary md:col-span-3" type="submit">
                ➕ Add Product
              </button>
            </form>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="flex gap-3">
                <input
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-input flex-1"
                />
                <button
                  onClick={addCategory}
                  type="button"
                  className="btn-success"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-3">
                <select
                  value={categoryToDelete}
                  onChange={(e) => setCategoryToDelete(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select category to delete</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    categoryToDelete && deleteCategory(categoryToDelete)
                  }
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">📋 Products</h2>
          {/* CATEGORY DROPDOWN */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full md:w-52 px-3 py-2 rounded-xl border border-gray-200 bg-white/80 dark:bg-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {/* SEARCH */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400" />

            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-2 rounded-xl border border-gray-200 bg-white/80 dark:bg-white/10 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
            />

            {/* CLEAR BUTTON */}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredProducts.map((p) => {
            const stock = p.inventory?.stock || 0;
            const status = getStatusClass(stock, p.min_stock);

            return (
              <div
                key={p.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border bg-white/60 dark:bg-white/5 hover:shadow-lg hover:scale-[1.01] transition-all"
              >
                {/* LEFT */}
                <div>
                  <div className="font-bold text-lg dark:text-white">
                    {p.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">
                    {p.categories?.name || "-"}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                  {/* PRICE */}
                  <div className="font-mono text-emerald-600 font-bold">
                    {formatVND(p.price || 0)}
                  </div>

                  {/* STATUS */}
                  <div className={`status-badge ${status.className}`}>
                    {status.label} ({stock})
                  </div>

                  {/* QR */}
                  <button
                    onClick={() => showQR(p.barcode)}
                    className="btn-qr hover:scale-105 transition"
                  >
                    QR
                  </button>

                  {/* ADMIN / non-staff ACTIONS */}
                  {canManage && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => importStock(p)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                      >
                        Import
                      </button>

                      {/* 🔥 EDIT FIX */}
                      <button
                        onClick={() => editProduct(p)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition font-semibold shadow-sm"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-gray-500 dark:text-slate-400">
              No products found
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <InputModal
          type={modal.type}
          product={modal.product}
          onClose={() => setModal(null)}
          onSubmit={async (data) => {
            // Đóng modal ngay lập tức để tạo cảm giác mượt mà
            const currentType = modal.type;
            const productId = modal.product.id;
            setModal(null);

            if (currentType === "edit") {
              await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: productId,
                  name: data.name,
                  price: Number(data.price),
                  min_stock: Number(data.min_stock),
                  category_id: data.category_id,
                }),
              });
              toast.success("Updated");
              loadProducts(true); // Edit thì nên gọi load ngầm vì nó không qua stock_movements
            }
            if (currentType === "import") {
              const {
                data: { session },
              } = await supabase.auth.getSession();

              const res = await fetch("/api/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  product_id: productId,
                  quantity: Number(data.qty),
                  user: session?.user,
                }),
              });

              if (res.ok) {
                toast.success("Imported");
                // ✅ ÉP CẬP NHẬT NGAY: Gọi loadProducts(true)
                // Chữ 'true' đảm bảo số nhảy luôn mà không hiện màn hình loading (skeleton)
                loadProducts(true);
              } else {
                toast.error("Import failed");
              }
            }
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
  );
}
