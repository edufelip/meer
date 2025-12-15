import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.12em] text-textSubtle">Painel</p>
        <h1 className="font-display text-3xl font-bold text-textDark">{title}</h1>
        {subtitle ? <p className="text-base text-textSubtle max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex-shrink-0">{actions}</div> : null}
    </div>
  );
}
