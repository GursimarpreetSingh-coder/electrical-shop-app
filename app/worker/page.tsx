"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { shopQuery } from "@/lib/firestore/helpers";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { WorkOrder } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { where } from "firebase/firestore";
import { ChevronRight } from "lucide-react";

export default function WorkerHomePage() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<WorkOrder[]>([]);

  useEffect(() => {
    if (!profile?.workerId && !profile?.uid) return;
    const workerRef = profile.workerId ?? profile.uid;
    shopQuery<WorkOrder>(COLLECTIONS.workOrders, [
      where("workerIds", "array-contains", workerRef),
    ]).then(setJobs);
  }, [profile]);

  return (
    <div className="space-y-4">
      {jobs.length === 0 ? (
        <p className="text-zinc-500 text-center py-12">No assigned jobs.</p>
      ) : (
        jobs.map((job) => (
          <Link key={job.id} href={`/worker/jobs/${job.id}`}>
            <Card className="hover:border-violet-500/30 transition">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Job #{job.id.slice(0, 6)}</p>
                  <Badge status={job.status} />
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
