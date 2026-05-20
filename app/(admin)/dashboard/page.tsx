"use client";

import { useMemo } from "react";
import {
  ClipboardList,
  Package,
  Users,
  IndianRupee,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type {
  ServiceRequest,
  InventoryItem,
  Attendance,
  Customer,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { where } from "firebase/firestore";
import { useShopCollection } from "@/hooks/useCollection";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: services } = useOrderedCollection<ServiceRequest>(
    COLLECTIONS.serviceRequests
  );
  const { data: inventory } = useOrderedCollection<InventoryItem>(
    COLLECTIONS.inventoryItems
  );
  const { data: customers } = useOrderedCollection<Customer>(
    COLLECTIONS.customers
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const { data: attendance } = useShopCollection<Attendance>(
    COLLECTIONS.attendance,
    [where("date", "==", today)],
    today
  );

  const stats = useMemo(() => {
    const open = services.filter((s) =>
      ["new", "assigned", "in_progress"].includes(s.status)
    ).length;
    const lowStock = inventory.filter((i) => i.qty <= i.minStock).length;
    const khata = customers.reduce((sum, c) => sum + (c.balance ?? 0), 0);
    const present = attendance.filter((a) => a.status === "present").length;
    return { open, lowStock, khata, present };
  }, [services, inventory, customers, attendance]);

  const recent = services.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Rattan Electricals — live overview
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Open Requests"
          value={stats.open}
          icon={ClipboardList}
          accent="violet"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={Package}
          accent="amber"
        />
        <StatCard
          title="Present Today"
          value={stats.present}
          subtitle={`of ${attendance.length} marked`}
          icon={Users}
          accent="emerald"
        />
        <StatCard
          title="Pending Khata"
          value={`₹${stats.khata.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          accent="blue"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Service Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-zinc-500 text-sm">No requests yet.</p>
          ) : (
            recent.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
              >
                <div>
                  <p className="font-medium text-white">{s.referenceCode}</p>
                  <p className="text-xs text-zinc-500 capitalize">
                    {s.problemType} · {s.source}
                  </p>
                </div>
                <div className="text-right">
                  <Badge status={s.status} />
                  <p className="text-xs text-zinc-600 mt-1">
                    {formatDateTime(s.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
