"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryItemSchema, type InventoryItemFormData } from "@/lib/schemas";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { InventoryItem } from "@/lib/types";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { VoiceField } from "@/components/voice/VoiceField";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import {
  createDoc,
  updateDocById,
  removeDoc,
} from "@/lib/firestore/helpers";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Scan } from "lucide-react";

export default function InventoryPage() {
  const { data: items, loading } = useOrderedCollection<InventoryItem>(
    COLLECTIONS.inventoryItems
  );
  const [showForm, setShowForm] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<InventoryItemFormData>({
      resolver: zodResolver(inventoryItemSchema),
      defaultValues: {
        category: "wires",
        unit: "pcs",
        qty: 0,
        minStock: 5,
        name: "",
        sku: "",
      },
    });

  const itemName = watch("name") ?? "";

  const onSubmit = handleSubmit(async (data) => {
    await createDoc(COLLECTIONS.inventoryItems, data);
    reset();
    setShowForm(false);
  });

  const adjustStock = async (item: InventoryItem, delta: number) => {
    await updateDocById(COLLECTIONS.inventoryItems, item.id, {
      qty: Math.max(0, item.qty + delta),
    });
    await createDoc(COLLECTIONS.inventoryTransactions, {
      itemId: item.id,
      type: delta > 0 ? "in" : "out",
      qty: Math.abs(delta),
      note: "Manual adjustment",
    });
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      (i.barcode && i.barcode.includes(search))
  );

  const lowStock = items.filter((i) => i.qty <= i.minStock);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${lowStock.length} low stock alert(s)`}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setScannerOpen(true)}
            >
              <Scan className="w-4 h-4 mr-1" /> Scan
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Add Item"}
            </Button>
          </div>
        }
      />

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setSearch(code);
          setValue("sku", code);
          setValue("barcode", code);
        }}
      />

      <Input
        placeholder="Search SKU, name, barcode..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>SKU / Barcode</Label>
                <Input {...register("sku")} />
              </div>
              <VoiceField
                label="Product name"
                value={itemName}
                onChange={(v) => setValue("name", v)}
                placeholder="Wire, MCB, fan..."
                required
              />
              <div>
                <Label>Category</Label>
                <Select {...register("category")}>
                  {INVENTORY_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900">
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Qty</Label>
                <Input type="number" {...register("qty")} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input {...register("unit")} />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" {...register("price")} />
              </div>
              <div>
                <Label>Min Stock</Label>
                <Input type="number" {...register("minStock")} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save Item</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-zinc-900/50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={
                item.qty <= item.minStock ? "border-amber-500/30" : ""
              }
            >
              <CardContent className="pt-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.sku} · {item.category}
                    </p>
                  </div>
                  {item.qty <= item.minStock && (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-2xl font-bold text-white mt-2">
                  {item.qty}{" "}
                  <span className="text-sm font-normal text-zinc-500">
                    {item.unit}
                  </span>
                </p>
                <p className="text-sm text-zinc-400">
                  {formatCurrency(item.price)} / unit
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => adjustStock(item, -1)}
                  >
                    −
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => adjustStock(item, 1)}
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      removeDoc(COLLECTIONS.inventoryItems, item.id)
                    }
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
