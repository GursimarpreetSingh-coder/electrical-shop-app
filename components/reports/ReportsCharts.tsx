"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function ReportsCharts({
  last7Days,
  expenseByCategory,
}: {
  last7Days: { date: string; jobs: number; revenue: number }[];
  expenseByCategory: { name: string; value: number }[];
}) {
  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days}>
            <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <Bar dataKey="jobs" fill="#7c3aed" name="Jobs Done" radius={4} />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ₹" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 mt-4">
        {expenseByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {expenseByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-12">
            No expense data yet.
          </p>
        )}
      </div>
    </>
  );
}
