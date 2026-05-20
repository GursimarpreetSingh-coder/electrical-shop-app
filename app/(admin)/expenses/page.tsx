"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormData } from "@/lib/schemas";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Expense } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { VoiceField } from "@/components/voice/VoiceField";
import { PageHeader } from "@/components/layout/PageHeader";
import { createDoc } from "@/lib/firestore/helpers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format } from "date-fns";

export default function ExpensesPage() {
  const { data: expenses, loading } = useOrderedCollection<Expense>(
    COLLECTIONS.expenses
  );
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<ExpenseFormData>({
      resolver: zodResolver(expenseSchema),
      defaultValues: {
        date: format(new Date(), "yyyy-MM-dd"),
        category: "purchase",
      },
    });

  const description = watch("description") ?? "";

  const onSubmit = handleSubmit(async (data) => {
    await createDoc(COLLECTIONS.expenses, data);
    reset({ date: format(new Date(), "yyyy-MM-dd"), category: "purchase" });
    setShowForm(false);
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description={`Total: ${formatCurrency(total)}`}
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Expense"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select {...register("category")}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900">
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" {...register("amount")} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" {...register("date")} />
              </div>
              <div className="sm:col-span-2">
                <VoiceField
                  label="Description"
                  value={description}
                  onChange={(v) => setValue("description", v)}
                  placeholder="Purchase, transport, bill..."
                  multiline
                  required
                />
              </div>
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-4 flex justify-between">
                <div>
                  <p className="text-white capitalize">
                    {e.category.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm text-zinc-500">{e.description}</p>
                  <p className="text-xs text-zinc-600">{formatDate(e.date)}</p>
                </div>
                <p className="font-semibold text-red-400">
                  {formatCurrency(e.amount)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
