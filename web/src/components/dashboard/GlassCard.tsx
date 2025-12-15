import type { ReactNode } from "react";
import clsx from "classnames";

export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[#833000] bg-[#833000] p-4 text-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      {children}
    </div>
  );
}
