import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "violet",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "violet" | "emerald" | "amber" | "blue" | "red";
}) {
  const accents = {
    violet: "from-violet-600/30 to-violet-900/10 text-violet-400",
    emerald: "from-emerald-600/30 to-emerald-900/10 text-emerald-400",
    amber: "from-amber-600/30 to-amber-900/10 text-amber-400",
    blue: "from-blue-600/30 to-blue-900/10 text-blue-400",
    red: "from-red-600/30 to-red-900/10 text-red-400",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl bg-gradient-to-br",
              accents[accent]
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
