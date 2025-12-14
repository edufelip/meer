"use client";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { clearToken } from "@/lib/auth";
import { ArrowRightIcon, BellIcon, CategoryIcon, CheckIcon, ContentIcon, DashboardIcon, HammerIcon, SettingsIcon, StoreIcon, UsersIcon } from "./icons";

type IconComponent = ComponentType<{ className?: string }>;
type SidebarIconKey = "dashboard" | "users" | "stores" | "approvals" | "settings";

const iconMap: Record<SidebarIconKey, IconComponent> = {
  dashboard: DashboardIcon,
  users: UsersIcon,
  stores: StoreIcon,
  approvals: CheckIcon,
  settings: SettingsIcon
};

export type SidebarItem = {
  label: string;
  href: Route;
  icon: SidebarIconKey;
  badge?: string;
  active?: boolean;
};

export function DashboardSidebar({ items }: { items: SidebarItem[] }) {
  const router = useRouter();

  const handleSignOut = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <aside className="h-full rounded-3xl bg-brand-forest border border-brand-card/50 p-4 text-white shadow-xl">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="size-10 rounded-full bg-gradient-to-br from-brand-primary to-[#1ac15c] ring-2 ring-brand-primary/25" />
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-wide">Guia Brechó</p>
          <p className="text-xs text-brand-muted">Painel Admin</p>
        </div>
      </div>

      <nav className="mt-4 flex flex-col gap-2">
        {items.map(({ label, href, icon, badge, active }) => {
          const Icon = iconMap[icon];
          return (
          <Link
            key={label}
            href={href}
            className={`group flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all ${
              active
                ? "bg-brand-card text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]"
                : "text-brand-muted hover:bg-brand-card/50 hover:text-white"
            }`}
          >
            <Icon className={active ? "text-brand-primary" : "text-brand-muted group-hover:text-brand-primary"} />
            <span className="flex-1">{label}</span>
            {badge ? (
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-bold text-brand-forest">{badge}</span>
            ) : null}
          </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-semibold text-brand-forest transition-all hover:scale-[1.01] hover:bg-white"
        >
          <ArrowRightIcon className="h-5 w-5" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
