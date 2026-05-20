"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenLine,
  Package,
  Receipt,
  Users,
  CalendarCheck,
  UserCircle,
  CreditCard,
  BarChart3,
  QrCode,
  LogOut,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, SHOP_NAME } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manual-entry", label: "Manual Entry", icon: PenLine },
  { href: "/services", label: "Service Requests", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: UserCircle },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/workers", label: "Workers", icon: Users },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/qr-settings", label: "QR Codes", icon: QrCode },
];

const mobilePrimary = navItems.slice(0, 4);

export function AdminSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const NavLink = ({
    href,
    label,
    icon: Icon,
    onClick,
  }: {
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    onClick?: () => void;
  }) => {
    const active =
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          active
            ? "bg-violet-600/25 text-violet-200 shadow-sm shadow-violet-900/20"
            : "text-zinc-400 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-white/[0.08] bg-zinc-950/80 backdrop-blur-2xl z-40">
        <div className="p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-600/30">
              V
            </div>
            <div>
              <p className="font-semibold text-white">{APP_NAME}</p>
              <p className="text-xs text-zinc-500">{SHOP_NAME}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.08]">
          <p className="text-xs text-zinc-500 truncate mb-2 capitalize">
            {profile?.displayName ?? "User"} · {profile?.role}
          </p>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white w-full px-3 py-2.5 rounded-xl hover:bg-white/5 transition"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-zinc-950/95 backdrop-blur-xl safe-area-pb">
        <div className="flex items-stretch justify-around px-1 pt-1 pb-2">
          {mobilePrimary.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition",
                  active ? "text-violet-400" : "text-zinc-500"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-medium",
              moreOpen ? "text-violet-400" : "text-zinc-500"
            )}
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile more menu */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl border-t border-white/10 bg-zinc-950 p-4 pb-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-white">All modules</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  {...item}
                  onClick={() => setMoreOpen(false)}
                />
              ))}
            </nav>
            <button
              onClick={() => {
                setMoreOpen(false);
                signOut();
              }}
              className="mt-4 flex items-center gap-2 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
