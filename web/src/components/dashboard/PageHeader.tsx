"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBack?: boolean;
};

export function PageHeader({ title, subtitle, actions, showBack = true }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const hideBack = !showBack || pathname === "/" || pathname === "/login" || pathname === "/dashboard";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {!hideBack ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-textDark shadow-sm transition hover:bg-black/5"
          >
            Voltar
          </button>
        ) : (
          <div />
        )}
        {actions ? <div className="flex-shrink-0">{actions}</div> : <div />}
      </div>
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.12em] text-textSubtle">Painel</p>
        <h1 className="font-display text-3xl font-bold text-textDark">{title}</h1>
        {subtitle ? <p className="text-base text-textSubtle max-w-2xl">{subtitle}</p> : null}
      </div>
    </div>
  );
}
