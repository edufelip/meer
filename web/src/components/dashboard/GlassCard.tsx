import type { ReactNode } from "react";
import clsx from "classnames";

export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)] backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}
