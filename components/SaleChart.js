"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SalesChart({ data }) {
  return (
    <div className="w-full h-75 border rounded p-4 bg-white">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Bar dataKey="sales" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
