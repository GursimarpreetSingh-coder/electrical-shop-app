"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  pa: "pa-IN",
} as const;

type LangKey = keyof typeof LANG_MAP;

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  /** Append mode: passes full phrase each session chunk */
  append?: boolean;
}

export function SpeechInput({
  onTranscript,
  className,
  append = true,
}: SpeechInputProps) {
  const [lang, setLang] = useState<LangKey>("hi");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionTextRef = useRef("");

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    setSupported(!!SR);
    if (!SR) {
      setHint("Chrome ya Edge browser use karo — voice ke liye");
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    sessionTextRef.current = "";
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(async () => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setHint("Voice supported nahi — Chrome try karo");
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setHint("Microphone allow karo — browser settings se");
      return;
    }

    setHint(null);
    stop();

    const recognition = new SR();
    recognition.lang = LANG_MAP[lang];
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        chunk += event.results[i][0].transcript;
      }
      if (!chunk.trim()) return;

      if (append) {
        sessionTextRef.current += (sessionTextRef.current ? " " : "") + chunk.trim();
        onTranscript(sessionTextRef.current);
      } else {
        onTranscript(chunk.trim());
      }
    };

    recognition.onerror = (event: Event) => {
      const err = event as Event & { error?: string };
      const code = err.error ?? "";
      if (code === "not-allowed") {
        setHint("Mic permission deny — address bar se Allow karo");
      } else if (code === "no-speech") {
        setHint("Kuch sunai nahi diya — dubara bolo");
      } else {
        setHint("Voice error — dubara try karo");
      }
      setListening(false);
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        setListening(false);
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    sessionTextRef.current = "";
    try {
      recognition.start();
      setListening(true);
    } catch {
      setHint("Mic start nahi hua — page refresh karo");
    }
  }, [lang, onTranscript, append, stop]);

  const toggle = () => {
    if (listening) stop();
    else start();
  };

  if (supported === false) {
    return (
      <p className="text-xs text-amber-400/90">{hint ?? "Voice: Chrome Android/PC"}</p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as LangKey)}
          className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-xs text-white"
          disabled={listening}
          aria-label="Voice language"
        >
          <option value="hi">हिंदी</option>
          <option value="pa">ਪੰਜਾਬੀ</option>
          <option value="en">English</option>
        </select>
        <Button
          type="button"
          variant={listening ? "danger" : "secondary"}
          size="sm"
          onClick={toggle}
          className={listening ? "animate-pulse" : ""}
        >
          {listening ? (
            <>
              <MicOff className="w-4 h-4 mr-1" /> Ruko
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-1" /> Bolo
            </>
          )}
        </Button>
      </div>
      {hint && <p className="text-xs text-amber-400/90">{hint}</p>}
      {listening && (
        <p className="text-xs text-violet-400">Sun raha hoon… bolte raho</p>
      )}
    </div>
  );
}
