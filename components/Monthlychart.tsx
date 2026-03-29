"use client";

import { useEffect, useState } from "react";
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

type Product = {
  id: string;
  name: string;
};

type MonthlyChartProps = {
  products: Product[];
};

const colors = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#f59e0b",
  "#0ea5e9",
];

export default function MonthlyChart({ products }: MonthlyChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!products.length) return;

    const loadAI = async () => {
      try {
        const res = await fetch("/api/ai/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products, mode: "month" }),
        });

        const json = await res.json();
        const ai = json.data || [];

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11

        const formatted = Array.from({ length: 30 }).map((_, i) => {
          const date = new Date(year, month, i + 1);
          const label = date.toLocaleDateString("en-US", { day: "numeric" });

          const row: Record<string, number | string> = { date: label };
          ai.forEach((p: any) => {
            row[p.name] = p.prediction?.[i] ?? 0;
          });
          return row;
        });

        setChartData(formatted);
      } catch (err) {
        console.error("AI prediction fetch error:", err);
      }
    };

    loadAI();
  }, [products]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{label}</div>
          {payload.map((p: any) => (
            <div key={p.name} style={{ color: p.stroke, marginBottom: 2 }}>
              {p.name}: {p.value} SP
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
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
            <XAxis dataKey="date" minTickGap={1} />
            <YAxis width={30} />
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

      {/* Custom Legend */}
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
  );
}
