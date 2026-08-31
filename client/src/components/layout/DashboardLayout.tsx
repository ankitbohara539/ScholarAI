import {
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials =
    user?.full_name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "U";

  const sidebar = (
    <>
      <div className="flex h-20 items-center gap-3 px-6">
        <span className="rounded-xl bg-primary p-2 text-white">
          <GraduationCap className="size-5" />
        </span>
        <div>
          <p className="font-semibold">ScholarAI</p>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              isActive ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4">
        <div className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
          Recommendations combine your verified profile with imported university data.
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background lg:flex">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-background shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-5"
              onClick={() => setMobileOpen(false)}
            >
              <X />
            </Button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <div>
              <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto gap-3 px-2">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="max-w-40 truncate text-sm font-medium">
                    {user?.full_name}
                  </p>
                  <p className="max-w-40 truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <Badge>{user?.role}</Badge>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={logout} className="text-destructive">
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
