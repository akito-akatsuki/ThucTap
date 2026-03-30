"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { formatVND } from "@/app/utils/currency";
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
import {
  LayoutDashboard,
  TrendingUp,
  Clock3,
  ArrowRight,
  Package,
  DollarSign,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  Target,
  UserCircle2,
  ChevronDown,
} from "lucide-react";

/* =========================
   TYPES
========================= */
type Category = { id: string; name: string };
type Product = { id: string; name: string; category_id: string; speed: string };
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
   COMPONENTS
========================= */
const KPICard = ({ title, value, subValue, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{subValue}</p>
    </div>
    <div className={`p-3 rounded-2xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon: Icon, color, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-500 hover:shadow-md transition-all text-left w-full group"
  >
    <div
      className={`p-3 rounded-xl ${color} text-white group-hover:scale-110 transition-transform`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <p className="font-bold text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
  </button>
);

/* =========================
   CUSTOM DROPDOWN UI
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
    <div className="relative w-full md:w-[280px]">
      <label className="text-sm font-medium text-gray-600 mb-1.5 block">
        Lọc theo danh mục:
      </label>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between border border-gray-200 px-4 py-3 rounded-xl cursor-pointer bg-white hover:border-blue-300 transition-colors shadow-sm"
      >
        <span
          className={`${selected ? "text-gray-900" : "text-gray-500"} text-base font-medium`}
        >
          {selected?.name || "Tất cả danh mục"}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      <div
        className={`absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl transition-all duration-300 origin-top z-50 overflow-hidden ${
          open
            ? "opacity-100 scale-y-100 translate-y-0"
            : "opacity-0 scale-y-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-700 font-medium"
        >
          Tất cả danh mục
        </div>

        {categories.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              onChange(c.id);
              setOpen(false);
            }}
            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-800"
          >
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthDropdown({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  const selected = monthNames[value - 1];

  return (
    <div className="relative w-full md:w-32">
      <label className="text-xs font-medium text-gray-600 mb-1 block">
        Tháng
      </label>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between border border-gray-200 px-3 py-2 rounded-xl cursor-pointer bg-white hover:border-emerald-300 transition-colors shadow-sm text-sm"
      >
        <span
          className={`${value ? "text-gray-900" : "text-gray-500"} font-medium`}
        >
          {selected || "Chọn"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      <div
        className={`absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl transition-all duration-300 origin-top z-50 overflow-hidden ${open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"}`}
      >
        {monthNames.map((name, index) => (
          <div
            key={index + 1}
            onClick={() => {
              onChange(index + 1);
              setOpen(false);
            }}
            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-800 text-sm"
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

function YearDropdown({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const years = Array.from(
    { length: 11 },
    (_, i) => new Date().getFullYear() - 5 + i,
  ); // 5 years back to 5 forward
  const selected = years.find((y) => y === value);

  return (
    <div className="relative w-full md:w-32">
      <label className="text-xs font-medium text-gray-600 mb-1 block">
        Năm
      </label>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between border border-gray-200 px-3 py-2 rounded-xl cursor-pointer bg-white hover:border-indigo-300 transition-colors shadow-sm text-sm"
      >
        <span
          className={`${selected ? "text-gray-900" : "text-gray-500"} font-medium`}
        >
          {selected || "Chọn"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      <div
        className={`absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl transition-all duration-300 origin-top z-50 overflow-hidden ${open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"}`}
      >
        {years.map((year) => (
          <div
            key={year}
            onClick={() => {
              onChange(year);
              setOpen(false);
            }}
            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-800 text-sm"
          >
            {year}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   CUSTOM CHART TOOLTIP UI
========================= */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 p-5 rounded-2xl shadow-2xl border border-gray-100 backdrop-blur-sm min-w-[220px]">
        <p className="text-sm font-bold text-gray-950 mb-3 border-b pb-2">
          {label}
        </p>
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center gap-3 py-1">
            <span
              style={{ background: item.color }}
              className="w-3 h-3 rounded-full flex-shrink-0"
            />
            <p
              className="text-sm font-medium text-gray-800 truncate"
              title={item.name}
            >
              {item.name}:
            </p>
            <p className="text-sm font-bold text-gray-950 ml-auto">
              {item.value} <span className="font-medium text-gray-500">SP</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Home() {
  const router = useRouter();

  const [chartData, setChartData] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  // Revenue states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [revenueMonthly, setRevenueMonthly] = useState("0 ₫");
  const [revenueYearly, setRevenueYearly] = useState("0 ₫");
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  const colors = [
    "#2563eb", // Blue
    "#16a34a", // Green
    "#dc2626", // Red
    "#9333ea", // Purple
    "#f59e0b", // Amber
    "#0ea5e9", // Sky
  ];

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadLogs();
  }, []);

  // Load revenue data
  const fetchRevenue = useCallback(
    async (month: number | null, year: number | null) => {
      setLoadingRevenue(true);
      try {
        const params = new URLSearchParams();
        if (month) params.append("month", month.toString());
        if (year) params.append("year", year.toString());

        const res = await fetch(`/api/revenue?${params.toString()}`);
        const json = await res.json();
        return json || [];
      } catch (e) {
        console.error("Error fetching revenue", e);
        return [];
      } finally {
        setLoadingRevenue(false);
      }
    },
    [],
  );

  useEffect(() => {
    const loadMonthly = async () => {
      const data = (await fetchRevenue(selectedMonth, selectedYear)) as any[];
      const total = data.reduce(
        (sum: number, r: any) => sum + Number(r.total_revenue || 0),
        0,
      );
      setRevenueMonthly(total > 0 ? formatVND(total) : "Chưa có dữ liệu");
      setRevenueData(data);
    };
    loadMonthly();
  }, [fetchRevenue, selectedMonth, selectedYear]);

  useEffect(() => {
    const loadYearly = async () => {
      const data = (await fetchRevenue(null, selectedYear)) as any[];
      const total = data.reduce(
        (sum: number, r: any) => sum + Number(r.total_revenue || 0),
        0,
      );
      setRevenueYearly(total > 0 ? formatVND(total) : "Chưa có dữ liệu");
    };
    loadYearly();
  }, [fetchRevenue, selectedYear]);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      setCategories(json.data || []);
    } catch (e) {
      console.error("Error loading categories", e);
    }
  };
  const loadProducts = async () => {
    try {
      // Fetch all products
      const resProducts = await fetch("/api/products");
      const jsonProducts = await resProducts.json();
      setAllProducts(jsonProducts.data || []);

      // Fetch top products
      const resTop = await fetch("/api/top");
      const jsonTop = await resTop.json();
      setTopProducts(jsonTop.data || []);
    } catch (e) {
      console.error("Error loading products", e);
    }
  };
  const loadLogs = async () => {
    try {
      const res = await fetch("/api/log");
      const json = await res.json();
      setLogs(json.data || []);
    } catch (e) {
      console.error("Error loading logs", e);
    }
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
      try {
        const aiRes = await fetch("/api/ai/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products, mode: "month" }),
        });

        const aiJson = await aiRes.json();
        const ai = aiJson.data || [];

        const today = new Date();
        const days = 30;
        const formatted = Array.from({ length: days }).map((_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const label = d.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "short",
          });
          let totalExport = 0;
          let totalImport = 0;

          ai.forEach((p: any) => {
            totalExport += p.export?.[i] ?? 0;
            totalImport += p.import?.[i] ?? 0;
          });

          return {
            date: label,
            export: totalExport,
            import: totalImport,
          };
        });

        setChartData(formatted);
      } catch (e) {
        console.error("Error loading AI prediction", e);
      }
    };

    loadAI();
  }, [products]);
  const groupedLogs = useMemo(() => {
    const grouped = logs.reduce<Record<string, any>>((acc, log: any) => {
      // Ép kiểu any để nhận users
      const key = log.invoice_id || "no-invoice";

      if (!acc[key]) {
        // ✅ Lấy tên hiển thị giống như bên LogPage
        const displayName = log.users
          ? `${log.users.name}`
          : log.created_by || "POS";

        acc[key] = {
          invoice_id: key,
          created_at: log.created_at,
          user: displayName, // Lưu tên ở đây
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
      RENDER MAIN UI
  ========================= */
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Monthly Revenue
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {loadingRevenue ? "Loading..." : revenueMonthly}
                </h3>

                {/* DROPDOWN */}
                <div className="flex gap-2 mt-2">
                  <MonthDropdown
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                  />
                  <YearDropdown
                    value={selectedYear}
                    onChange={setSelectedYear}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <KPICard
            title="Yearly Revenue"
            value={loadingRevenue ? "Loading..." : revenueYearly}
            subValue={`${selectedYear}`}
            icon={TrendingUp}
            color="bg-indigo-600"
          />

          <KPICard
            title="Inventory Value"
            value="7,920 Kđ"
            subValue="Capital circulating in stock"
            icon={Package}
            color="bg-orange-500"
          />

          <KPICard
            title="Inventory Health"
            value="82/100"
            subValue="Good - Need restock for 5 items"
            icon={Activity}
            color="bg-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="xl:col-span-2 space-y-8">
            {/* AI SALES STRATEGY */}
            <div className="bg-white shadow-sm rounded-[32px] p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    AI Sales Strategy
                  </h2>
                </div>

                <CategoryDropdown
                  categories={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>

              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F1F5F9"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    <Line
                      type="monotone"
                      dataKey="import"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={false}
                      name="Import"
                    />

                    <Line
                      type="monotone"
                      dataKey="export"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={false}
                      name="Export"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TOP PRODUCTS */}
            <div className="bg-white shadow-sm rounded-[32px] p-8 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Top Potential Products
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topProducts.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-blue-600">
                      #{i + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        Speed: {p.speed} items/day
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-8">
            {/* INVENTORY HEALTH */}
            <div className="bg-white shadow-sm rounded-[32px] p-8 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Inventory Health
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-emerald-50 rounded-2xl text-emerald-700">
                  <span>Stable</span>
                  <span className="font-bold">12</span>
                </div>

                <div className="flex justify-between p-4 bg-orange-50 rounded-2xl text-orange-700">
                  <span>Warning</span>
                  <span className="font-bold">5</span>
                </div>

                <div className="flex justify-between p-4 bg-red-50 rounded-2xl text-red-700">
                  <span>Critical</span>
                  <span className="font-bold">2</span>
                </div>
              </div>
            </div>

            {/* RECENT LOGS */}
            {/* RECENT LOGS */}
            <div className="bg-white shadow-sm rounded-[32px] p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Inventory Logs
                </h3>
                <button
                  onClick={() => router.push("/logs")}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
                >
                  View All Logs
                </button>
              </div>
              <div className="space-y-4">
                {groupedLogs.map((log) => (
                  <div
                    key={log.invoice_id}
                    className="text-xs p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="font-mono font-bold text-sm mb-1">
                      {log.invoice_id?.slice(0, 8) || "N/A"}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full font-bold ${
                          log.type === "export"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {log.type?.toUpperCase()}
                      </span>

                      {/* ✅ THAY ĐỔI Ở ĐÂY: Dùng log.user thay vì log.created_by */}
                      <span className="text-gray-500 font-medium">
                        {log.user}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AIBot />
    </main>
  );
}
