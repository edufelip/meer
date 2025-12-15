import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { ShortcutGrid, type ShortcutItem } from "@/components/dashboard/ShortcutGrid";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/Sidebar";
import { dashboardIcons } from "@/components/dashboard/icons";

const sidebarItems: SidebarItem[] = [
  { label: "Visão Geral", href: "/dashboard", icon: "dashboard", active: true },
  { label: "Usuários", href: "/users", icon: "users" },
  { label: "Brechós", href: "/stores", icon: "stores" },
  { label: "Aprovações", href: "/moderation", icon: "approvals", badge: "3" },
  { label: "Configurações", href: "/dashboard", icon: "settings" }
];

const shortcuts: ShortcutItem[] = [
  { title: "Brechós", description: "Listar e moderar brechós", href: "/stores", icon: dashboardIcons.stores },
  { title: "Conteúdos", description: "Publicações dos brechós", href: "/contents", icon: dashboardIcons.contents },
  { title: "Usuários", description: "Gerenciar contas e privilégios", href: "/users", icon: dashboardIcons.users },
  { title: "Moderação", description: "Fila de denúncias e revisões", href: "/moderation", icon: dashboardIcons.moderation },
  { title: "Categorias", description: "Gerenciar categorias", href: "/categories", icon: dashboardIcons.categories }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen w-full bg-background text-textDark">
      <div className="grid min-h-screen w-full gap-6 p-4 sm:p-6 lg:grid-cols-[280px,1fr] lg:p-10">
        <DashboardSidebar items={sidebarItems} />
        <section className="flex flex-col gap-8 lg:gap-12">
          <DashboardHeader notifications={3} />
          <div className="flex flex-col gap-8 lg:gap-12">
            <DashboardHero
              title="Resumo"
              description="Escolha uma seção para gerenciar brechós, conteúdos, usuários ou moderação."
            />
            <ShortcutGrid items={shortcuts} />
          </div>
        </section>
      </div>
    </div>
  );
}
