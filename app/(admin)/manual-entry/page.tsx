"use client";

import { ServiceRequestForm } from "@/components/forms/ServiceRequestForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitServiceRequest } from "@/lib/firestore/helpers";
import type { ServiceRequestFormData } from "@/lib/schemas";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function ManualEntryPage() {
  const [ref, setRef] = useState<string | null>(null);

  const handleSubmit = async (data: ServiceRequestFormData, files: File[]) => {
    const result = await submitServiceRequest({
      ...data,
      source: "manual",
      photoFiles: files,
      voiceTranscript: data.voiceTranscript,
    });
    setRef(result.referenceCode);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manual Entry</h1>
        <p className="text-zinc-500 text-sm mt-1">
          For walk-in customers without smartphone
        </p>
      </div>

      {ref ? (
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <p className="text-white font-medium">Entry saved</p>
              <p className="text-violet-400 font-mono">{ref}</p>
              <button
                className="text-sm text-zinc-400 mt-2 underline"
                onClick={() => setRef(null)}
              >
                Add another
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Customer & Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceRequestForm
              onSubmit={handleSubmit}
              submitLabel="Save Entry"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
