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
      className="group relative flex flex-col justify-between gap-2 rounded-2xl border border-[#833000] bg-[#833000] p-6 text-left text-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_25px_80px_-40px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white/15 p-3 text-white">
          <Icon className="h-6 w-6" />
        </div>
        <ArrowRightIcon className="h-5 w-5 text-white opacity-60 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white transition-colors group-hover:text-white/90">{title}</h3>
        <p className="mt-1 text-sm text-white/80">{description}</p>
      </div>
    </Link>
  );
}
