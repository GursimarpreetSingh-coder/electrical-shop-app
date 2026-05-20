import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300",
  assigned: "bg-amber-500/20 text-amber-300",
  in_progress: "bg-violet-500/20 text-violet-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  closed: "bg-zinc-500/20 text-zinc-400",
  pending: "bg-amber-500/20 text-amber-300",
  paid: "bg-emerald-500/20 text-emerald-300",
  partial: "bg-orange-500/20 text-orange-300",
  present: "bg-emerald-500/20 text-emerald-300",
  absent: "bg-red-500/20 text-red-300",
};

export function Badge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize",
        variants[status] ?? "bg-zinc-500/20 text-zinc-400",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
