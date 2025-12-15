import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-textDark">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="absolute right-10 top-32 h-72 w-72 rounded-full bg-brand-card/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/3 h-48 w-48 rounded-full bg-black/5 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        {children}
      </div>
    </div>
  );
}
