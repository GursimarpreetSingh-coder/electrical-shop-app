"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceRequestSchema, type ServiceRequestFormData } from "@/lib/schemas";
import { PROBLEM_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { VoiceField } from "@/components/voice/VoiceField";
import { Camera } from "lucide-react";

interface ServiceRequestFormProps {
  onSubmit: (data: ServiceRequestFormData, files: File[]) => Promise<void>;
  submitLabel?: string;
}

export function ServiceRequestForm({
  onSubmit,
  submitLabel = "Submit Request",
}: ServiceRequestFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      problemType: "repair",
      description: "",
    },
  });

  const description = watch("description") ?? "";
  const customerName = watch("name") ?? "";
  const address = watch("address") ?? "";

  const onFormSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(data, files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onFormSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <VoiceField
          label="Name"
          value={customerName}
          onChange={(v) => setValue("name", v, { shouldValidate: true })}
          placeholder="Customer name"
          required
        />
        <div>
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" {...register("phone")} placeholder="9876543210" />
          {errors.phone && (
            <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <VoiceField
        label="Address"
        value={address}
        onChange={(v) => setValue("address", v, { shouldValidate: true })}
        placeholder="Full address"
        required
      />

      <div>
        <Label htmlFor="problemType">Request Type *</Label>
        <Select id="problemType" {...register("problemType")}>
          {PROBLEM_TYPES.map((t) => (
            <option key={t} value={t} className="bg-zinc-900">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      <VoiceField
        label="Problem description"
        value={description}
        onChange={(v) => {
          setValue("description", v, { shouldValidate: true });
          setValue("voiceTranscript", v);
        }}
        placeholder="Fan, motor, wiring, MCB..."
        multiline
        required
      />
      {errors.description && (
        <p className="text-red-400 text-xs -mt-2">
          {errors.description.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="preferredTime">Preferred Service Time</Label>
          <Input
            id="preferredTime"
            {...register("preferredTime")}
            placeholder="e.g. Tomorrow morning"
          />
        </div>
        <div>
          <Label htmlFor="paymentNotes">Payment Info</Label>
          <Input
            id="paymentNotes"
            {...register("paymentNotes")}
            placeholder="Cash / UPI / Credit"
          />
        </div>
      </div>

      <div>
        <Label>Photos of damaged items</Label>
        <label className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 p-6 cursor-pointer hover:border-violet-500/50 transition">
          <Camera className="w-8 h-8 text-violet-400" />
          <span className="text-sm text-zinc-400">
            Tap to upload photos (fan, motor, wiring...)
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) =>
              setFiles(Array.from(e.target.files ?? []))
            }
          />
        </label>
        {files.length > 0 && (
          <p className="text-xs text-zinc-500 mt-2">{files.length} file(s) selected</p>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm rounded-lg bg-red-500/10 p-3">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Submitting..." : submitLabel}
      </Button>
    </form>
  );
}
