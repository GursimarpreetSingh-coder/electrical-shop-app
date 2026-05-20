"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

const ADMIN_ROLES = ["owner", "staff"];

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!configured) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (profile && !ADMIN_ROLES.includes(profile.role)) {
      router.replace("/worker");
    }
  }, [user, profile, loading, configured, router, pathname]);

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold text-white">Firebase not configured</h2>
          <p className="text-zinc-400 text-sm">
            Copy <code className="text-violet-400">.env.example</code> to{" "}
            <code className="text-violet-400">.env.local</code> and add your Firebase
            project keys. Enable Auth (Email + Phone), Firestore, and Storage.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile && !ADMIN_ROLES.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
