import Link from "next/link";
import type { Route } from "next";
import type { ComponentType } from "react";
import { ArrowRightIcon } from "./icons";

type ShortcutCardProps = {
  title: string;
  description: string;
  href: Route;
  icon: ComponentType<{ className?: string }>;
};

export function ShortcutCard({ title, description, href, icon: Icon }: ShortcutCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:border-brand-primary/60 hover:shadow-[0_25px_80px_-40px_rgba(43,238,121,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-brand-card p-3 text-brand-primary">
          <Icon className="h-6 w-6" />
        </div>
        <ArrowRightIcon className="h-5 w-5 text-brand-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white transition-colors group-hover:text-brand-primary">{title}</h3>
        <p className="mt-1 text-sm text-brand-muted/80">{description}</p>
      </div>
    </Link>
  );
}
