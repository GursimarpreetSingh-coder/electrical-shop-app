"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  getDocById,
  updateDocById,
  uploadFiles,
} from "@/lib/firestore/helpers";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VoiceField } from "@/components/voice/VoiceField";
import { ArrowLeft, Camera } from "lucide-react";

export default function WorkerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<WorkOrder | null>(null);
  const [materials, setMaterials] = useState("");
  const [report, setReport] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getDocById<WorkOrder>(COLLECTIONS.workOrders, id).then((j) => {
      setJob(j);
      if (j?.report) setReport(j.report);
    });
  }, [id]);

  const updateStatus = async (status: WorkOrderStatus) => {
    await updateDocById(COLLECTIONS.workOrders, id, { status });
    if (job?.requestId) {
      const serviceStatus =
        status === "completed"
          ? "completed"
          : status === "in_progress"
            ? "in_progress"
            : "assigned";
      await updateDocById(COLLECTIONS.serviceRequests, job.requestId, {
        status: serviceStatus,
      });
    }
    const updated = await getDocById<WorkOrder>(COLLECTIONS.workOrders, id);
    setJob(updated);
  };

  const saveMaterials = async () => {
    if (!job || !materials.trim()) return;
    const list = [
      ...job.materials,
      { name: materials, qty: 1, note: "Voice/manual entry" },
    ];
    await updateDocById(COLLECTIONS.workOrders, id, {
      materials: list,
      status: "materials_logged",
    });
    setMaterials("");
    const updated = await getDocById<WorkOrder>(COLLECTIONS.workOrders, id);
    setJob(updated);
  };

  const uploadPhotos = async (
    files: FileList | null,
    field: "beforePhotos" | "afterPhotos" | "sitePhotos"
  ) => {
    if (!files?.length || !job) return;
    setUploading(true);
    try {
      const urls = await uploadFiles(`workers/${id}/${field}`, Array.from(files));
      await updateDocById(COLLECTIONS.workOrders, id, {
        [field]: [...(job[field] ?? []), ...urls],
      });
      const updated = await getDocById<WorkOrder>(COLLECTIONS.workOrders, id);
      setJob(updated);
    } finally {
      setUploading(false);
    }
  };

  const completeJob = async () => {
    await updateDocById(COLLECTIONS.workOrders, id, {
      status: "completed",
      report,
    });
    await updateStatus("completed");
  };

  if (!job) {
    return <p className="text-zinc-500">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <Link
        href="/worker"
        className="inline-flex items-center gap-2 text-sm text-zinc-400"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Job Details</h2>
        <Badge status={job.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => updateStatus("in_progress")}>
          Start Work
        </Button>
        <Button size="sm" variant="secondary" onClick={() => updateStatus("pending")}>
          Pending
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <VoiceField
            label="Materials used"
            value={materials}
            onChange={setMaterials}
            placeholder="Wires, MCB, fan parts..."
            multiline
          />
          <Button onClick={saveMaterials}>Log Materials</Button>
          <ul className="text-sm text-zinc-400 space-y-1">
            {job.materials?.map((m, i) => (
              <li key={i}>
                {m.name} × {m.qty}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["beforePhotos", "afterPhotos"] as const).map((field) => (
            <div key={field}>
              <Label className="capitalize">{field.replace("Photos", "")} photos</Label>
              <label className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 p-4 cursor-pointer">
                <Camera className="w-5 h-5 text-violet-400" />
                <span className="text-sm text-zinc-400">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => uploadPhotos(e.target.files, field)}
                />
              </label>
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {(job[field] ?? []).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={report} onChange={(e) => setReport(e.target.value)} />
          <Button className="w-full" size="lg" onClick={completeJob}>
            Mark Job Complete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
