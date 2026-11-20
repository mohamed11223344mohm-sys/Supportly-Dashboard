import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock,
  Globe,
  Hash,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AgentStatus,
  CustomerPlan,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from "@/types";

export function TicketStatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const config: Record<
    TicketStatus,
    { label: string; dot: string; styles: string }
  > = {
    open: {
      label: "Open",
      dot: "bg-blue-500",
      styles:
        "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
    in_progress: {
      label: "In Progress",
      dot: "bg-indigo-500",
      styles:
        "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    },
    pending: {
      label: "Pending",
      dot: "bg-amber-500",
      styles:
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    resolved: {
      label: "Resolved",
      dot: "bg-emerald-500",
      styles:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    closed: {
      label: "Closed",
      dot: "bg-zinc-400",
      styles:
        "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    },
  };

  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        c.styles,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function TicketPriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  const config: Record<
    TicketPriority,
    { label: string; icon: React.ReactNode; styles: string }
  > = {
    urgent: {
      label: "Urgent",
      icon: <AlertCircle className="h-3 w-3" />,
      styles:
        "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    },
    high: {
      label: "High",
      icon: <ArrowUp className="h-3 w-3" />,
      styles:
        "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    },
    medium: {
      label: "Medium",
      icon: <ArrowRight className="h-3 w-3" />,
      styles:
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    low: {
      label: "Low",
      icon: <ArrowDown className="h-3 w-3" />,
      styles:
        "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    },
  };

  const c = config[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        c.styles,
        className
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

export function AgentStatusBadge({
  status,
  className,
}: {
  status: AgentStatus;
  className?: string;
}) {
  const config: Record<AgentStatus, { label: string; dot: string; text: string }> = {
    online: {
      label: "Online",
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    busy: {
      label: "Busy",
      dot: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-400",
    },
    away: {
      label: "Away",
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
    },
    offline: {
      label: "Offline",
      dot: "bg-zinc-400",
      text: "text-muted-foreground",
    },
  };
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", c.text, className)}>
      <span className={cn("h-2 w-2 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: TicketChannel }) {
  const map: Record<TicketChannel, { label: string; icon: React.ReactNode }> = {
    email: { label: "Email", icon: <Mail className="h-3 w-3" /> },
    chat: { label: "Live Chat", icon: <MessageSquare className="h-3 w-3" /> },
    web: { label: "Web Portal", icon: <Globe className="h-3 w-3" /> },
    slack: { label: "Slack", icon: <Hash className="h-3 w-3" /> },
    phone: { label: "Phone", icon: <Phone className="h-3 w-3" /> },
  };
  const item = map[channel];
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {item.icon}
      {item.label}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: CustomerPlan }) {
  const map: Record<CustomerPlan, string> = {
    Enterprise:
      "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    Business:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Growth: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    Starter: "border-border bg-secondary text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        map[plan]
      )}
    >
      {plan}
    </span>
  );
}

export function SlaBadge({
  label,
  variant,
}: {
  label: string;
  variant: "ok" | "warning" | "breached" | "met";
}) {
  const styles = {
    ok: "border-border bg-secondary/70 text-muted-foreground",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    breached: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    met: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  };
  const icon =
    variant === "met" ? (
      <CheckCircle2 className="h-3 w-3" />
    ) : variant === "breached" ? (
      <AlertTriangle className="h-3 w-3" />
    ) : (
      <Clock className="h-3 w-3" />
    );

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap",
        styles[variant]
      )}
    >
      {icon}
      {label}
    </span>
  );
}
