import * as React from "react";
import { cn, getInitials } from "@/lib/utils";
import type { AgentStatus } from "@/types";

const SIZE_MAP = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-14 w-14 text-base",
};

const STATUS_DOT_MAP: Record<AgentStatus, string> = {
  online: "bg-emerald-500",
  busy: "bg-rose-500",
  away: "bg-amber-500",
  offline: "bg-zinc-400",
};

export function UserAvatar({
  name,
  color = "bg-primary",
  size = "md",
  status,
  className,
}: {
  name: string;
  color?: string;
  size?: keyof typeof SIZE_MAP;
  status?: AgentStatus;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white ring-1 ring-black/5 dark:ring-white/10 select-none",
          SIZE_MAP[size],
          color
        )}
      >
        {getInitials(name)}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-card",
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
            STATUS_DOT_MAP[status]
          )}
        />
      )}
    </div>
  );
}
