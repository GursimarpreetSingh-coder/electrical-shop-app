"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Expense, Bill, ServiceRequest, InventoryItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { format, subDays, parseISO } from "date-fns";

const ReportsCharts = dynamic(
  () =>
    import("@/components/reports/ReportsCharts").then((m) => m.ReportsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-zinc-900/50 animate-pulse" />
    ),
  }
);

export default function ReportsPage() {
  const { data: expenses } = useOrderedCollection<Expense>(
    COLLECTIONS.expenses
  );
  const { data: bills } = useOrderedCollection<Bill>(COLLECTIONS.bills);
  const { data: services } = useOrderedCollection<ServiceRequest>(
    COLLECTIONS.serviceRequests
  );
  const { data: inventory } = useOrderedCollection<InventoryItem>(
    COLLECTIONS.inventoryItems
  );

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [expenses]);

  const last7Days = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, "yyyy-MM-dd");
    });
    return days.map((date) => {
      const completed = services.filter(
        (s) =>
          s.status === "completed" &&
          format(s.createdAt, "yyyy-MM-dd") === date
      ).length;
      const revenue = bills
        .filter((b) => format(b.createdAt, "yyyy-MM-dd") === date)
        .reduce((s, b) => s + b.paid, 0);
      return {
        date: format(parseISO(date), "dd MMM"),
        jobs: completed,
        revenue,
      };
    });
  }, [services, bills]);

  const stockValue = inventory.reduce((s, i) => s + i.qty * i.price, 0);
  const totalRevenue = bills.reduce((s, b) => s + b.paid, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-zinc-500">Revenue Collected</p>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-zinc-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-400">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-zinc-500">Stock Value</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stockValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportsCharts
            last7Days={last7Days}
            expenseByCategory={expenseByCategory}
          />
        </CardContent>
      </Card>
    </div>
  );
}
