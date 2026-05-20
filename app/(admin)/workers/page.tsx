"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workerSchema, type WorkerFormData } from "@/lib/schemas";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Worker } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { VoiceField } from "@/components/voice/VoiceField";
import { PageHeader } from "@/components/layout/PageHeader";
import { createDoc, updateDocById } from "@/lib/firestore/helpers";
import { formatCurrency } from "@/lib/utils";

export default function WorkersPage() {
  const { data: workers, loading } = useOrderedCollection<Worker>(
    COLLECTIONS.workers
  );
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: { wageType: "daily", rate: 500 },
  });

  const onSubmit = handleSubmit(async (data) => {
    await createDoc(COLLECTIONS.workers, {
      ...data,
      advances: 0,
      active: true,
    });
    reset();
    setShowForm(false);
  });

  const addAdvance = async (worker: Worker, amount: number) => {
    await updateDocById(COLLECTIONS.workers, worker.id, {
      advances: worker.advances + amount,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workers"
        description="Electricians & field staff"
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Worker"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <VoiceField
                label="Name"
                value={watch("name") ?? ""}
                onChange={(v) => setValue("name", v)}
                required
              />
              <div>
                <Label>Phone</Label>
                <Input {...register("phone")} />
              </div>
              <div>
                <Label>Wage Type</Label>
                <Select {...register("wageType")}>
                  <option value="daily" className="bg-zinc-900">Daily</option>
                  <option value="monthly" className="bg-zinc-900">Monthly</option>
                </Select>
              </div>
              <div>
                <Label>Rate (₹)</Label>
                <Input type="number" {...register("rate")} />
              </div>
              <div className="sm:col-span-2">
                <VoiceField
                  label="Skills"
                  value={watch("skills") ?? ""}
                  onChange={(v) => setValue("skills", v)}
                  placeholder="Wiring, motors..."
                />
              </div>
              <Button type="submit">Save Worker</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workers.map((w) => (
            <Card key={w.id}>
              <CardContent className="pt-5">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-white">{w.name}</p>
                    <p className="text-sm text-zinc-500">{w.phone}</p>
                    <p className="text-xs text-zinc-600 capitalize mt-1">
                      {w.wageType} · {formatCurrency(w.rate)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      w.active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20"
                    }`}
                  >
                    {w.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-amber-400 mt-2">
                  Advances: {formatCurrency(w.advances)}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => addAdvance(w, 500)}
                >
                  + ₹500 Advance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
