import type { ReactNode } from "react";
import clsx from "classnames";

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-textDark ring-1 ring-black/10",
        className
      )}
    >
      {children}
    </span>
  );
}
