"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { billSchema, type BillFormData } from "@/lib/schemas";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Bill, Customer, LedgerEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import {
  createDoc,
  updateDocById,
  getDocById,
} from "@/lib/firestore/helpers";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  const { data: bills } = useOrderedCollection<Bill>(COLLECTIONS.bills);
  const { data: customers } = useOrderedCollection<Customer>(
    COLLECTIONS.customers
  );
  const { data: ledger } = useOrderedCollection<LedgerEntry>(
    COLLECTIONS.ledgerEntries
  );
  const [tab, setTab] = useState<"bills" | "khata" | "ledger">("bills");
  const [showForm, setShowForm] = useState(false);

  const { register, control, handleSubmit, watch } = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      lineItems: [{ description: "", qty: 1, rate: 0, amount: 0 }],
      paid: 0,
    },
  });

  const { fields, append } = useFieldArray({ control, name: "lineItems" });
  const customerId = watch("customerId");

  const onSubmit = handleSubmit(async (data) => {
    const total = data.lineItems.reduce((s, l) => s + l.amount, 0);
    const due = total - data.paid;
    const status =
      data.paid >= total ? "paid" : data.paid > 0 ? "partial" : "draft";

    const billId = await createDoc(COLLECTIONS.bills, {
      ...data,
      total,
      due,
      status,
    });

    if (due > 0) {
      const customer = customers.find((c) => c.id === data.customerId);
      if (customer) {
        await updateDocById(COLLECTIONS.customers, customer.id, {
          balance: customer.balance + due,
        });
        await createDoc(COLLECTIONS.ledgerEntries, {
          partyType: "customer",
          partyId: customer.id,
          partyName: customer.name,
          debit: due,
          credit: 0,
          note: `Bill ${billId}`,
          date: new Date().toISOString().slice(0, 10),
        });
      }
    }
    setShowForm(false);
  });

  const recordPayment = async (bill: Bill, amount: number) => {
    const newPaid = bill.paid + amount;
    const newDue = bill.total - newPaid;
    await updateDocById(COLLECTIONS.bills, bill.id, {
      paid: newPaid,
      due: newDue,
      status: newDue <= 0 ? "paid" : "partial",
    });
    const customer = await getDocById<Customer>(
      COLLECTIONS.customers,
      bill.customerId
    );
    if (customer) {
      await updateDocById(COLLECTIONS.customers, customer.id, {
        balance: Math.max(0, customer.balance - amount),
      });
      await createDoc(COLLECTIONS.ledgerEntries, {
        partyType: "customer",
        partyId: customer.id,
        partyName: customer.name,
        debit: 0,
        credit: amount,
        note: `Payment bill ${bill.id}`,
        date: new Date().toISOString().slice(0, 10),
      });
    }
  };

  const khataCustomers = customers.filter((c) => c.balance > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
      </div>

      <div className="flex gap-2">
        {(["bills", "khata", "ledger"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "primary" : "secondary"}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
        {tab === "bills" && (
          <Button size="sm" className="ml-auto" onClick={() => setShowForm(!showForm)}>
            New Bill
          </Button>
        )}
      </div>

      {showForm && tab === "bills" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label>Customer</Label>
                <Select {...register("customerId")}>
                  <option value="" className="bg-zinc-900">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900">
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </Select>
              </div>
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Description"
                    {...register(`lineItems.${i}.description`)}
                    className="col-span-2"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    {...register(`lineItems.${i}.qty`)}
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    {...register(`lineItems.${i}.amount`)}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({ description: "", qty: 1, rate: 0, amount: 0 })
                }
              >
                + Line
              </Button>
              <div>
                <Label>Paid now (₹)</Label>
                <Input type="number" {...register("paid")} />
              </div>
              <Button type="submit" disabled={!customerId}>
                Create Bill
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "bills" && (
        <div className="space-y-3">
          {bills.map((b) => {
            const c = customers.find((x) => x.id === b.customerId);
            return (
              <Card key={b.id}>
                <CardContent className="pt-4 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="text-white">{c?.name ?? "Customer"}</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(b.total)}
                    </p>
                    <p className="text-sm text-amber-400">
                      Due: {formatCurrency(b.due)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={b.status} />
                    {b.due > 0 && (
                      <Button
                        size="sm"
                        onClick={() => recordPayment(b, b.due)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "khata" && (
        <div className="space-y-3">
          {khataCustomers.length === 0 ? (
            <p className="text-zinc-500">No pending khata.</p>
          ) : (
            khataCustomers.map((c) => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex justify-between">
                  <span className="text-white">{c.name}</span>
                  <span className="text-amber-400 font-semibold">
                    {formatCurrency(c.balance)}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "ledger" && (
        <div className="space-y-2">
          {ledger.map((l) => (
            <Card key={l.id}>
              <CardContent className="pt-3 flex justify-between text-sm">
                <span className="text-zinc-300">
                  {l.partyName} — {l.note}
                </span>
                <span>
                  {l.debit > 0 && (
                    <span className="text-red-400">+{formatCurrency(l.debit)}</span>
                  )}
                  {l.credit > 0 && (
                    <span className="text-emerald-400">
                      −{formatCurrency(l.credit)}
                    </span>
                  )}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
