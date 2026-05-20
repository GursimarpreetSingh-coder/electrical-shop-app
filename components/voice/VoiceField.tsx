"use client";

import { Input, Textarea, Label } from "@/components/ui/input";
import { SpeechInput } from "./SpeechInput";
import { cn } from "@/lib/utils";

interface VoiceFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

/** Text field + voice (Hindi / Punjabi / English) — use on every form */
export function VoiceField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  required,
  className,
  id,
}: VoiceFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  const handleVoice = (spoken: string) => {
    if (!spoken.trim()) return;
    onChange(value ? `${value} ${spoken}`.trim() : spoken.trim());
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        <SpeechInput onTranscript={handleVoice} append={false} />
      </div>
      {multiline ? (
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <Input
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
