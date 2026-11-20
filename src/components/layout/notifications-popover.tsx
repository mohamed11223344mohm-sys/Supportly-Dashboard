"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  MessageSquare,
  Ticket,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSupportStore } from "@/store/use-support-store";
import { RelativeTime } from "@/components/shared/time-display";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types";

function NotificationIcon({ type }: { type: NotificationItem["type"] }) {
  switch (type) {
    case "sla":
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
      );
    case "message":
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <MessageSquare className="h-3.5 w-3.5" />
        </div>
      );
    case "assignment":
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <UserCheck className="h-3.5 w-3.5" />
        </div>
      );
    default:
      return (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Ticket className="h-3.5 w-3.5" />
        </div>
      );
  }
}

export function NotificationsPopover() {
  const [open, setOpen] = React.useState(false);
  const notifications = useSupportStore((s) => s.notifications);
  const markNotificationRead = useSupportStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useSupportStore((s) => s.markAllNotificationsRead);
  const clearNotifications = useSupportStore((s) => s.clearNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={markAllNotificationsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-muted-foreground"
                onClick={clearNotifications}
                title="Clear notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/70">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                New ticket alerts and mentions will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const content = (
                <div
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                    !item.read && "bg-primary/[0.03]"
                  )}
                >
                  <NotificationIcon type={item.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs leading-snug",
                          !item.read ? "font-semibold text-foreground" : "font-medium text-foreground/85"
                        )}
                      >
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">
                      <RelativeTime date={item.createdAt} />
                    </p>
                  </div>
                </div>
              );

              return item.href ? (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    markNotificationRead(item.id);
                    setOpen(false);
                  }}
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markNotificationRead(item.id)}
                  className="block w-full text-left cursor-pointer"
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
