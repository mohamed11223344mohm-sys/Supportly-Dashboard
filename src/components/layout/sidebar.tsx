"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Ticket,
  Users,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupportStore } from "@/store/use-support-store";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  showCollapseToggle = false,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}) {
  const pathname = usePathname();
  const tickets = useSupportStore((s) => s.tickets);
  const conversations = useSupportStore((s) => s.conversations);
  const agents = useSupportStore((s) => s.agents);
  const currentAgentId = useSupportStore((s) => s.currentAgentId);
  const workspaceName = useSupportStore((s) => s.settings.workspace.companyName);

  const activeTicketCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;
  const unreadInboxCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const currentAgent = agents.find((a) => a.id === currentAgentId) ?? agents[0];

  const primaryNav: NavItem[] = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Tickets", href: "/tickets", icon: Ticket, badge: tickets.length },
    { label: "Inbox", href: "/inbox", icon: Inbox, badge: unreadInboxCount },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Team", href: "/team", icon: UserCog },
    { label: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const secondaryNav: NavItem[] = [
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const linkNode = (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
          collapsed && "justify-center px-2",
          active
            ? "bg-primary/10 text-primary dark:bg-primary/15"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 && (
              <span className="rounded bg-primary/15 px-1.5 py-0.2 font-mono text-[10px] text-primary">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkNode;
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border px-3.5",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <LifeBuoy className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Supportly
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Pro
                </span>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                {workspaceName}
              </p>
            </div>
          )}
        </Link>

        {showCollapseToggle && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Workspace
            </p>
          )}
          {primaryNav.map(renderItem)}
        </div>

        <div className="space-y-1">
          {!collapsed && (
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              System
            </p>
          )}
          {secondaryNav.map(renderItem)}
        </div>
      </div>

      {/* Expand toggle when collapsed */}
      {showCollapseToggle && collapsed && (
        <div className="flex justify-center border-t border-sidebar-border py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Agent Footer */}
      {currentAgent && (
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-accent",
              collapsed && "justify-center"
            )}
          >
            <UserAvatar
              name={currentAgent.name}
              color={currentAgent.avatarColor}
              size="sm"
              status={currentAgent.status}
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {currentAgent.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {currentAgent.role}
                </p>
              </div>
            )}
          </Link>
        </div>
      )}
    </div>
  );
}
