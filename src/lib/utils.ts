import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function formatRelativeTime(isoDate: string, nowMs: number = Date.now()): string {
  const date = new Date(isoDate);
  const now = new Date(nowMs);
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

export function formatDateTime(isoDate: string, timeZone?: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatShortTime(isoDate: string, timeZone?: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const remMins = Math.round(minutes % 60);
    return remMins > 0 ? `${wholeHours}h ${remMins}m` : `${wholeHours}h`;
  }
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours % 24);
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSlaStatus(
  slaDueAt: string,
  isResolvedOrClosed: boolean,
  nowMs: number = Date.now()
): {
  label: string;
  variant: "ok" | "warning" | "breached" | "met";
} {
  if (isResolvedOrClosed) {
    return { label: "SLA Met", variant: "met" };
  }
  const due = new Date(slaDueAt).getTime();
  const diffMins = Math.round((due - nowMs) / 60000);

  if (diffMins < 0) {
    return { label: `Breached ${formatDuration(Math.abs(diffMins))}`, variant: "breached" };
  }
  if (diffMins <= 120) {
    return { label: `Due in ${formatDuration(diffMins)}`, variant: "warning" };
  }
  return { label: `Due in ${formatDuration(diffMins)}`, variant: "ok" };
}

export function exportToCsv(filename: string, rows: Record<string, string | number | boolean | null | undefined>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const val = row[key] ?? "";
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
