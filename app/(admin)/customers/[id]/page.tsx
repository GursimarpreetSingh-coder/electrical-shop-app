"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getDocById, shopQuery } from "@/lib/firestore/helpers";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Customer, ServiceRequest, Bill } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { where } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    getDocById<Customer>(COLLECTIONS.customers, id).then(setCustomer);
    shopQuery<ServiceRequest>(COLLECTIONS.serviceRequests, [
      where("customerId", "==", id),
    ]).then(setRequests);
    shopQuery<Bill>(COLLECTIONS.bills, [
      where("customerId", "==", id),
    ]).then(setBills);
  }, [id]);

  if (!customer) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
        <p className="text-zinc-500">{customer.phone}</p>
        <p className="text-sm text-zinc-600 mt-1">{customer.address}</p>
        <p className="text-lg text-amber-400 mt-2">
          Khata: {formatCurrency(customer.balance)}
        </p>
      </div>

      {customer.installedItems && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Installed Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">{customer.installedItems}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-zinc-500 text-sm">No services yet.</p>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="flex justify-between py-2 border-b border-white/5"
              >
                <div>
                  <p className="text-white text-sm">{r.referenceCode}</p>
                  <p className="text-xs text-zinc-500 capitalize">
                    {r.problemType}
                  </p>
                </div>
                <Badge status={r.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bills.map((b) => (
            <div
              key={b.id}
              className="flex justify-between py-2 border-b border-white/5"
            >
              <span className="text-white">{formatCurrency(b.total)}</span>
              <span className="text-zinc-500 text-sm">
                Due {formatCurrency(b.due)} · {b.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
