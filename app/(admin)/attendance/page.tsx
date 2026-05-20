"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useOrderedCollection } from "@/hooks/useCollection";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type { Worker, Attendance, AttendanceStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createDoc, shopQuery } from "@/lib/firestore/helpers";
import { where } from "firebase/firestore";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "half_day",
  "leave",
];

export default function AttendancePage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: workers } = useOrderedCollection<Worker>(COLLECTIONS.workers);
  const [records, setRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    shopQuery<Attendance>(COLLECTIONS.attendance, [
      where("date", "==", date),
    ]).then(setRecords);
  }, [date]);

  const mark = async (workerId: string, status: AttendanceStatus) => {
    const existing = records.find((r) => r.workerId === workerId);
    if (existing) return;
    await createDoc(COLLECTIONS.attendance, {
      workerId,
      date,
      status,
      checkIn: status === "present" ? format(new Date(), "HH:mm") : "",
    });
    const updated = await shopQuery<Attendance>(COLLECTIONS.attendance, [
      where("date", "==", date),
    ]);
    setRecords(updated);
  };

  const activeWorkers = workers.filter((w) => w.active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Attendance</h1>
        <p className="text-zinc-500 text-sm">Daily present / absent</p>
      </div>

      <div className="max-w-xs">
        <Label>Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {format(new Date(date), "dd MMMM yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeWorkers.map((w) => {
            const rec = records.find((r) => r.workerId === w.id);
            return (
              <div
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-white/5"
              >
                <p className="text-white font-medium">{w.name}</p>
                {rec ? (
                  <Badge status={rec.status} />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="secondary"
                        onClick={() => mark(w.id, s)}
                      >
                        {s.replace(/_/g, " ")}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
