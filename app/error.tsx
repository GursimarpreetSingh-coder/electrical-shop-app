"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#030306] text-white">
      <h2 className="text-xl font-bold mb-2">Kuch galat ho gaya</h2>
      <p className="text-zinc-500 text-sm text-center max-w-md mb-6">
        Page load nahi hui. Neeche try karo ya cache clear karo.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()}>Dubara try</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/login")}>
          Login par jao
        </Button>
      </div>
    </div>
  );
}
