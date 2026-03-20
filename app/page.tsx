"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import AIBot from "@/components/AIBot";

/* =========================
   TYPES
========================= */
type Category = { id: string; name: string };
type Product = { id: string; name: string; category_id: string };
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

/* =========================
   DROPDOWN
========================= */
function CategoryDropdown({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);

  return (
    <div className="relative w-full md:w-[200px]">
      <div
        onClick={() => setOpen(!open)}
        className="border px-3 py-2 rounded cursor-pointer bg-white text-black"
      >
        {selected?.name || "All Categories"}
      </div>

      <div
        className={`absolute left-0 right-0 mt-1 bg-white border rounded shadow transition-all duration-200 origin-top z-50 ${
          open
            ? "opacity-100 scale-y-100"
            : "opacity-0 scale-y-0 pointer-events-none"
        }`}
      >
        <div
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          All Categories
        </div>

        {categories.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              onChange(c.id);
              setOpen(false);
            }}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
          >
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [chartData, setChartData] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

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
    loadProducts();
    loadLogs();
  }, []);

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    const json = await res.json();
    setCategories(json.data || []);
  };

  const loadProducts = async () => {
    const res = await fetch("/api/products");
    const json = await res.json();
    setAllProducts(json.data || []);
  };

  const loadLogs = async () => {
    const res = await fetch("/api/log");
    const json = await res.json();
    setLogs(json.data || []);
  };

  const products = useMemo(() => {
    if (!selectedCategory) return allProducts;
    return allProducts.filter((p) => p.category_id === selectedCategory);
  }, [allProducts, selectedCategory]);

  /* =========================
     CHART DATA - MONTH ONLY
  ========================= */
  useEffect(() => {
    if (!products.length) {
      setChartData([]);
      return;
    }

    const loadAI = async () => {
      const aiRes = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, mode: "month" }), // luôn month
      });

      const aiJson = await aiRes.json();
      const ai = aiJson.data || [];

      const today = new Date();
      const days = 30;

      const formatted = Array.from({ length: days }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const row: Record<string, number | string> = { date: label };

        ai.forEach((p: any) => {
          row[p.name] = p.prediction?.[i] ?? 0; // số lượng SP
        });

        return row;
      });

      setChartData(formatted);
    };

    loadAI();
  }, [products]);

  const groupedLogs = useMemo(() => {
    const grouped = logs.reduce<Record<string, any>>((acc, log) => {
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
    }, {});

    return Object.values(grouped)
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      )
      .slice(0, 3);
  }, [logs]);

  /* =========================
     RENDER
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Inventory AI
        </h1>

        {/* FILTER */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <CategoryDropdown
            categories={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        {/* CHART */}
        <div className="bg-white shadow rounded-xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">
            AI Sales Prediction (30 Days)
          </h2>

          <div className="w-full h-64 md:h-80 min-w-0">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={20} />
                  <YAxis width={30} />
                  <Tooltip
                    formatter={(v) => `${v} SP`} // hiển thị SP
                  />
                  {products.map((p, index) => (
                    <Line
                      key={p.id}
                      dataKey={p.name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* CUSTOM LEGEND */}
          <div className="flex flex-wrap gap-2 mt-4">
            {products.map((p, index) => (
              <div
                key={p.id}
                className="flex items-center gap-2 text-xs bg-gray-100 px-2 py-1 rounded max-w-[120px]"
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: colors[index % colors.length],
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
                <span className="truncate" title={p.name}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LOG */}
        <div className="bg-white shadow rounded-xl p-4 md:p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Stock Movement Logs
            </h2>

            <button
              onClick={() => router.push("/logs")}
              className="text-sm px-4 py-2 bg-black text-white rounded"
            >
              View All →
            </button>
          </div>

          {groupedLogs.length === 0 && <p>No logs</p>}

          {groupedLogs.map((order: any) => (
            <DashboardLogItem
              key={order.invoice_id}
              order={order}
              shortId={order.invoice_id?.slice(0, 8)}
            />
          ))}
        </div>
      </div>

      <AIBot />
    </main>
  );
}

/* =========================
   LOG ITEM
========================= */
function DashboardLogItem({ order, shortId }: any) {
  const [open, setOpen] = useState(false);
  const isExport = order.type === "export";

  return (
    <div className="border rounded-xl p-3 mb-3">
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-between cursor-pointer"
      >
        <div>
          <h3 className="font-semibold flex gap-2">
            <span
              className={`px-2 py-1 text-white text-xs rounded ${
                isExport ? "bg-red-500" : "bg-green-500"
              }`}
            >
              INV-{shortId}
            </span>
          </h3>
          <p className="text-xs text-gray-500">👤 {order.user}</p>
        </div>
      </div>

      {open && (
        <div className="mt-3 border-t pt-3 text-sm">
          {order.items.map((i: Log) => (
            <div key={i.id} className="grid grid-cols-4 gap-2 py-1">
              <span>{i.products?.name || "Unknown"}</span>
              <span>{i.type}</span>
              <span>x{i.quantity}</span>
              <span className="text-right">
                {i.price ? `${i.price} SP` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
