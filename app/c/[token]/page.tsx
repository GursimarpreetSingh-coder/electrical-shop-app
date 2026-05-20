"use client";

import { use, useEffect, useState } from "react";
import { ServiceRequestForm } from "@/components/forms/ServiceRequestForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitServiceRequest, validateQrToken } from "@/lib/firestore/helpers";
import type { ServiceRequestFormData } from "@/lib/schemas";
import { SHOP_NAME } from "@/lib/constants";
import { CheckCircle2 } from "lucide-react";

export default function PublicRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [valid, setValid] = useState<boolean | null>(null);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  useEffect(() => {
    validateQrToken(token).then(setValid).catch(() => setValid(false));
  }, [token]);

  const handleSubmit = async (data: ServiceRequestFormData, files: File[]) => {
    const result = await submitServiceRequest({
      ...data,
      source: "qr",
      qrToken: token,
      photoFiles: files,
      voiceTranscript: data.voiceTranscript,
    });
    setDone({ ref: result.referenceCode });
  };

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-zinc-400">Invalid or expired QR link.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Request Submitted</h1>
        <p className="text-zinc-400 mb-4">
          {SHOP_NAME} has received your request.
        </p>
        <p className="text-violet-400 font-mono text-lg">{done.ref}</p>
        <p className="text-sm text-zinc-500 mt-4">
          Save this reference number. We will contact you shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-xl font-bold mx-auto mb-3">
          V
        </div>
        <h1 className="text-xl font-bold text-white">{SHOP_NAME}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Submit repair, installation or inquiry
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Request</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceRequestForm
            onSubmit={handleSubmit}
            submitLabel="Submit to Rattan Electricals"
          />
        </CardContent>
      </Card>
    </div>
  );
}
