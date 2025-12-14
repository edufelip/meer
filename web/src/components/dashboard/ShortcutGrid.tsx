import type { Route } from "next";
import type { ComponentType } from "react";
import { ShortcutCard } from "./ShortcutCard";

export type ShortcutItem = {
  title: string;
  description: string;
  href: Route;
  icon: ComponentType<{ className?: string }>;
};

export function ShortcutGrid({ items }: { items: ShortcutItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <ShortcutCard key={item.title} {...item} />
      ))}
    </div>
  );
}
