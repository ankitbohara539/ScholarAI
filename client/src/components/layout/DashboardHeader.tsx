import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { mediaUrl } from "@/lib/media";

export function DashboardHeader({
  title,
  collapsed,
  onToggle,
  onOpenMobile,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  onOpenMobile: () => void;
}) {
  const { user, logout } = useAuth();
  const initials =
    user?.full_name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "U";
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-background/90 px-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobile}
          aria-label="Open navigation"
        >
          <Menu />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
        <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto gap-2 px-1 sm:px-2">
              <Avatar>
                <AvatarImage
                  src={mediaUrl(user?.profile_picture_url)}
                  alt={user?.full_name ?? "Profile"}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden max-w-36 text-left md:block">
                <p className="truncate text-sm font-medium">
                  {user?.full_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <Badge className="hidden sm:inline-flex">{user?.role}</Badge>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
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
  );
}
