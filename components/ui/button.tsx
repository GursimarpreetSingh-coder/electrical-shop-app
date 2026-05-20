import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" &&
            "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/25",
          variant === "secondary" &&
            "bg-white/10 text-white border border-white/10 hover:bg-white/15",
          variant === "ghost" && "text-zinc-300 hover:bg-white/5",
          variant === "danger" &&
            "bg-red-600/90 text-white hover:bg-red-500",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2.5 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
