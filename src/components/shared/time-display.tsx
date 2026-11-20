"use client";

import * as React from "react";
import {
  formatDateTime,
  formatRelativeTime,
  formatShortTime,
  getSlaStatus,
} from "@/lib/utils";
import { SlaBadge } from "@/components/shared/status-badge";

/**
 * Deterministic fallback timestamp used during SSR & initial hydration
 * so server and client HTML always match identically.
 */
const SSR_NOW_MS = Date.parse("2026-11-18T14:00:00.000Z");

function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

export function RelativeTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const hydrated = useHydrated();
  const label = formatRelativeTime(date, hydrated ? Date.now() : SSR_NOW_MS);
  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}

export function FormattedDate({
  date,
  dateOnly = false,
  className,
}: {
  date: string;
  dateOnly?: boolean;
  className?: string;
}) {
  const hydrated = useHydrated();
  const formatted = hydrated
    ? formatDateTime(date)
    : formatDateTime(date, "UTC");
  const display = dateOnly ? formatted.split(",")[0] : formatted;
  return (
    <span className={className} suppressHydrationWarning>
      {display}
    </span>
  );
}

export function ShortTime({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const hydrated = useHydrated();
  const display = hydrated
    ? formatShortTime(date)
    : formatShortTime(date, "UTC");
  return (
    <span className={className} suppressHydrationWarning>
      {display}
    </span>
  );
}

export function LiveSlaBadge({
  slaDueAt,
  isResolvedOrClosed,
}: {
  slaDueAt: string;
  isResolvedOrClosed: boolean;
}) {
  const hydrated = useHydrated();
  const sla = getSlaStatus(
    slaDueAt,
    isResolvedOrClosed,
    hydrated ? Date.now() : SSR_NOW_MS
  );
  return <SlaBadge label={sla.label} variant={sla.variant} />;
}
