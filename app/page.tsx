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

export default function Home() {
  const router = useRouter();

  const [chartData, setChartData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const colors = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#9333ea",
    "#f59e0b",
    "#0ea5e9",
  ];

  useEffect(() => {
    loadData();
    loadLogs();
  }, []);

  const loadData = async () => {
    try {
      const productRes = await fetch("/api/products");
      const productJson = await productRes.json();

      console.log("PRODUCTS:", productJson);

      const productList = productJson.data || [];
      setProducts(productList);

      if (productList.length === 0) return;

      const aiRes = await fetch("/api/ai/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: productList,
        }),
      });

      const aiJson = await aiRes.json();

      console.log("AI RESULT:", aiJson);

      const ai = aiJson.data || [];

      const today = new Date();

      const formatted = Array.from({ length: 7 }).map((_, i) => {
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

      console.log("STOCK LOG:", json);

      setLogs(json.data || []);
    } catch (err) {
      console.error("LOG ERROR:", err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Inventory AI</h1>

        {/* CHART */}

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            AI Sales Prediction (Next 7 Days)
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

        {/* STOCK LOG */}

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

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Qty</th>
                <th className="text-left py-2">By</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {logs.slice(0, 5).map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="py-2">{log.products?.name}</td>

                  <td className="py-2">
                    {log.type === "import" ? "📦 Import" : "🛒 Export"}
                  </td>

                  <td className="py-2">{log.quantity}</td>

                  <td className="py-2">{log.created_by}</td>

                  <td className="py-2">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
