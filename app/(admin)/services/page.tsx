"use client";

import { useState } from "react";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { ServiceRequest, Worker, Customer } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import {
  updateDocById,
  createDoc,
  getDocById,
} from "@/lib/firestore/helpers";
import { formatDateTime } from "@/lib/utils";
import type { ServiceStatus } from "@/lib/types";

const STATUSES: ServiceStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "completed",
  "closed",
];

export default function ServicesPage() {
  const { data: services, loading } = useOrderedCollection<ServiceRequest>(
    COLLECTIONS.serviceRequests
  );
  const { data: workers } = useOrderedCollection<Worker>(COLLECTIONS.workers);
  const [filter, setFilter] = useState<string>("all");
  const [customers, setCustomers] = useState<Record<string, Customer>>({});

  const loadCustomer = async (id: string) => {
    if (customers[id]) return;
    const c = await getDocById<Customer>(COLLECTIONS.customers, id);
    if (c) setCustomers((prev) => ({ ...prev, [id]: c }));
  };

  const filtered =
    filter === "all"
      ? services
      : services.filter((s) => s.status === filter);

  const updateStatus = async (id: string, status: ServiceStatus) => {
    await updateDocById(COLLECTIONS.serviceRequests, id, { status });
  };

  const assignWorker = async (
    request: ServiceRequest,
    workerId: string
  ) => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;
    await updateDocById(COLLECTIONS.serviceRequests, request.id, {
      status: "assigned",
      assignedWorkerIds: [workerId],
    });
    await createDoc(COLLECTIONS.workOrders, {
      requestId: request.id,
      customerId: request.customerId,
      workerIds: [workerId],
      status: "pending",
      materials: [],
      sitePhotos: [],
      beforePhotos: [],
      afterPhotos: [],
      report: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Service Requests</h1>
          <p className="text-zinc-500 text-sm">{services.length} total</p>
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="all" className="bg-zinc-900">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-zinc-900">
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((s) => {
            loadCustomer(s.customerId);
            const customer = customers[s.customerId];
            return (
              <Card key={s.id}>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">
                        {s.referenceCode}
                      </p>
                      <p className="text-sm text-zinc-400 capitalize">
                        {s.problemType} · {s.source}
                      </p>
                      {customer && (
                        <p className="text-sm text-zinc-500 mt-1">
                          {customer.name} — {customer.phone}
                        </p>
                      )}
                    </div>
                    <Badge status={s.status} />
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-2">
                    {s.description}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {formatDateTime(s.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[140px]">
                      <Label>Status</Label>
                      <Select
                        value={s.status}
                        onChange={(e) =>
                          updateStatus(s.id, e.target.value as ServiceStatus)
                        }
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-zinc-900">
                            {st}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <Label>Assign worker</Label>
                      <Select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) assignWorker(s, e.target.value);
                        }}
                      >
                        <option value="" className="bg-zinc-900">
                          Select worker
                        </option>
                        {workers
                          .filter((w) => w.active)
                          .map((w) => (
                            <option key={w.id} value={w.id} className="bg-zinc-900">
                              {w.name}
                            </option>
                          ))}
                      </Select>
                    </div>
                  </div>
                  {s.photos?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {s.photos.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
