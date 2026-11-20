"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupportStore } from "@/store/use-support-store";
import type { AgentStatus } from "@/types";
import { toast } from "sonner";

export function TopNavbar({
  onOpenMobileNav,
  onOpenCommand,
  onOpenNewTicket,
}: {
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
  onOpenNewTicket: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  const agents = useSupportStore((s) => s.agents);
  const currentAgentId = useSupportStore((s) => s.currentAgentId);
  const profile = useSupportStore((s) => s.settings.profile);
  const updateAgentStatus = useSupportStore((s) => s.updateAgentStatus);

  const currentAgent = agents.find((a) => a.id === currentAgentId) ?? agents[0];

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleStatusChange = (status: AgentStatus) => {
    if (!currentAgent) return;
    updateAgentStatus(currentAgent.id, status);
    toast.success(`Availability set to ${status}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile drawer trigger + Search trigger */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <button
          type="button"
          onClick={onOpenCommand}
          className="flex h-9 w-full max-w-sm items-center justify-between gap-2 rounded-lg border border-input bg-background/80 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground cursor-pointer"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Search tickets, customers...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions + Notifications + Theme + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button size="sm" onClick={onOpenNewTicket} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Ticket</span>
        </Button>

        <NotificationsPopover />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full p-0.5 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <UserAvatar
                name={profile.name}
                color={currentAgent?.avatarColor ?? "bg-indigo-600"}
                size="sm"
                status={currentAgent?.status ?? "online"}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium text-foreground">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">
              Set Status
            </DropdownMenuLabel>
            {(["online", "busy", "away", "offline"] as AgentStatus[]).map((st) => (
              <DropdownMenuItem
                key={st}
                onClick={() => handleStatusChange(st)}
                className="capitalize"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    st === "online"
                      ? "bg-emerald-500"
                      : st === "busy"
                      ? "bg-rose-500"
                      : st === "away"
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                  }`}
                />
                {st}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/team">
                <Users className="h-4 w-4" />
                Team Roster
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Workspace Preferences
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
