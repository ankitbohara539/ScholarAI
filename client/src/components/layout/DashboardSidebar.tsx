import { GraduationCap } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { NavItem } from "@/components/layout/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function DashboardSidebar({
  navItems,
  collapsed = false,
  onNavigate,
}: {
  navItems: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const initials =
    user?.full_name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "U";
  return (
    <>
      <div
        className={cn(
          "flex h-20 items-center gap-3 px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <span className="rounded-xl bg-primary p-2 text-white">
          <GraduationCap className="size-5" />
        </span>
        <span
          className={cn(
            "whitespace-nowrap font-semibold transition-opacity",
            collapsed && "sr-only",
          )}
        >
          ScholarAI
        </span>
      </div>
      <Separator />
      <nav
        className={cn(
          "flex-1 space-y-1 overflow-y-auto p-3",
          collapsed && "px-2",
        )}
      >
        {navItems.map(({ label, icon: Icon, to }) => (
          <Tooltip key={to} label={label} disabled={!collapsed}>
            <NavLink
              to={to}
              onClick={onNavigate}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              <span className={cn("whitespace-nowrap", collapsed && "sr-only")}>
                {label}
              </span>
            </NavLink>
          </Tooltip>
        ))}
      </nav>
      <Separator />
      <Tooltip label={user?.full_name ?? "Profile"} disabled={!collapsed}>
        <div
          className={cn(
            "flex items-center gap-3 p-4",
            collapsed && "justify-center px-2",
          )}
        >
          <Avatar>
            <AvatarImage
              src={mediaUrl(user?.profile_picture_url)}
              alt={user?.full_name ?? "Profile"}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className={cn("min-w-0", collapsed && "sr-only")}>
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">
              {user?.role}
            </p>
          </div>
        </div>
      </Tooltip>
    </>
  );
}
