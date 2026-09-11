import type { LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

export function DashboardLayout({
  title,
  children,
  navItems,
}: {
  title: string;
  navItems: NavItem[];
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("scholarai:sidebar-collapsed") === "true",
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("scholarai:sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f8fc]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-background transition-[width] duration-200 lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <DashboardSidebar navItems={navItems} collapsed={collapsed} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate ScholarAI dashboard pages
          </SheetDescription>
          <DashboardSidebar
            navItems={navItems}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <DashboardHeader
          title={title}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
