"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AIBot from "@/components/AIBot";
import { formatVND } from "./utils/currency";

/* =========================
   TYPES
========================= */
type Log = {
  id: string;
  invoice_id?: string;
  created_at?: string;
  created_by?: string;
  quantity: number;
  price?: number;
  type: string;
  products?: { name?: string };
};

export default function Home() {
  const router = useRouter();

  const [chartData, setChartData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // 🔥 NEW
  const [mode, setMode] = useState<"week" | "month">("week");

  const colors = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#9333ea",
    "#f59e0b",
    "#0ea5e9",
  ];

  useEffect(() => {
    loadCategories();
    loadData();
    loadLogs();
  }, [selectedCategory, mode]);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      console.error("CATEGORY ERROR:", err);
    }
  };

  const loadData = async () => {
    try {
      const productRes = await fetch("/api/products");
      const productJson = await productRes.json();

      let productList = productJson.data || [];

      if (selectedCategory) {
        productList = productList.filter(
          (p: any) => p.category_id === selectedCategory,
        );
      }

      setProducts(productList);

      if (productList.length === 0) return;

      const aiRes = await fetch("/api/ai/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: productList,
          mode,
        }),
      });

      const aiJson = await aiRes.json();
      const ai = aiJson.data || [];

      const today = new Date();
      const days = mode === "week" ? 7 : 30;

      const formatted = Array.from({ length: days }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const row: any = { date: label };

        ai.forEach((p: any) => {
          row[p.name] = p.prediction?.[i] ?? 0;
        });

        return row;
      });

      setChartData(formatted);
    } catch (err) {
      console.error("AI ERROR:", err);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch("/api/log");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err) {
      console.error("LOG ERROR:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Inventory AI</h1>

        {/* FILTER */}
        <div className="mb-4 flex gap-4 items-center">
          {/* CATEGORY */}
          <div>
            <label className="mr-2 font-semibold">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border px-2 py-1 rounded"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 🔥 TOGGLE */}
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setMode("week")}
              className={`px-4 py-1 text-sm ${
                mode === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Week
            </button>

            <button
              onClick={() => setMode("month")}
              className={`px-4 py-1 text-sm ${
                mode === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* CHART */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            AI Sales Prediction ({mode === "week" ? "7 Days" : "30 Days"})
          </h2>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />

                {products.map((p, index) => (
                  <Line
                    key={p.id}
                    dataKey={p.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LOG */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stock Movement Logs</h2>

            <button
              onClick={() => router.push("/logs")}
              className="text-sm px-4 py-2 bg-black text-white rounded"
            >
              View All →
            </button>
          </div>

          {Object.values(
            [...logs]
              .sort(
                (a, b) =>
                  new Date(b.created_at || 0).getTime() -
                  new Date(a.created_at || 0).getTime(),
              )
              .reduce<Record<string, any>>((acc, log) => {
                const key = log.invoice_id || "no-invoice";

                if (!acc[key]) {
                  acc[key] = {
                    invoice_id: key,
                    created_at: log.created_at,
                    user: log.created_by || "POS",
                    items: [],
                    type: log.type,
                  };
                }

                acc[key].items.push(log);
                return acc;
              }, {}),
          )
            .slice(0, 3)
            .map((order: any) => {
              const shortId =
                order.invoice_id !== "no-invoice"
                  ? order.invoice_id.slice(0, 8).toUpperCase()
                  : "N/A";

              const total = order.items.reduce(
                (sum: number, i: Log) => sum + i.quantity * (i.price || 0),
                0,
              );

              return (
                <DashboardLogItem
                  key={order.invoice_id}
                  order={order}
                  shortId={shortId}
                  total={total}
                />
              );
            })}
        </div>
      </div>

      <AIBot />
    </main>
  );
}

/* =========================
   DROPDOWN COMPONENT
========================= */

function DashboardLogItem({
  order,
  shortId,
  total,
}: {
  order: any;
  shortId: string;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const isExport = order.type === "export";

  return (
    <div className="border rounded-xl p-4 mb-3">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between cursor-pointer"
      >
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-white text-xs font-bold ${
                isExport ? "bg-red-500" : "bg-green-500"
              }`}
            >
              🧾 INV-{shortId}
            </span>

            <span>{open ? "▲" : "▼"}</span>
          </h3>
          <p className="text-xs text-gray-500">👤 {order.user}</p>
        </div>

        <div className="font-bold text-green-600">💰{formatVND(total)}</div>
      </div>

      {open && (
        <div className="mt-3 border-t pt-3">
          {order.items.map((i: Log) => (
            <div key={i.id} className="grid grid-cols-4 gap-2 py-1 text-sm">
              <span>{i.products?.name || "Unknown"}</span>
              <span>{i.type === "export" ? "📦 Export" : "📥 Import"}</span>
              <span>x{i.quantity}</span>
              <span className="text-right">{formatVND(i.price || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
