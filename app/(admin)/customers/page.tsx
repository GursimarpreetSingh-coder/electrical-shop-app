"use client";

import Link from "next/link";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Customer } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export default function CustomersPage() {
  const { data: customers, loading } = useOrderedCollection<Customer>(
    COLLECTIONS.customers
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-zinc-500 text-sm">History & khata balance</p>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="grid gap-3">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="hover:border-violet-500/30 transition">
                <CardContent className="pt-5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{c.name}</p>
                    <p className="text-sm text-zinc-500">{c.phone}</p>
                    <p className="text-xs text-zinc-600 truncate max-w-xs">
                      {c.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        c.balance > 0 ? "text-amber-400" : "text-zinc-500"
                      }
                    >
                      {formatCurrency(c.balance)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
