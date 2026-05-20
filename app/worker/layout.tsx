import { WorkerGuard } from "@/components/layout/WorkerGuard";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkerGuard>
      <div className="min-h-screen bg-[var(--bg)] pb-8">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 py-4">
          <h1 className="text-lg font-bold text-white">My Jobs</h1>
          <p className="text-xs text-zinc-500">Rattan Electricals — Worker</p>
        </header>
        <main className="p-4 max-w-lg mx-auto">{children}</main>
      </div>
    </WorkerGuard>
  );
}
