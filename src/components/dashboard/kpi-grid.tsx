"use client";

import * as React from "react";
import { CheckCircle2, Clock, Flame, Layers } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { formatDuration } from "@/lib/utils";
import type { DashboardKPIs } from "@/lib/analytics";

export function KpiGrid({ kpis }: { kpis: DashboardKPIs }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Tickets"
        value={kpis.totalTickets}
        trend="+12.4%"
        trendPositive
        subtext={`${kpis.resolvedOrClosedTickets} resolved · ${kpis.resolutionRate}% resolution rate`}
        icon={<Layers className="h-4 w-4" />}
        iconBg="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      />
      <StatCard
        label="Open & Queue"
        value={kpis.openTickets}
        trend={kpis.urgentOpenTickets > 0 ? `${kpis.urgentOpenTickets} urgent` : "Healthy"}
        trendPositive={kpis.urgentOpenTickets === 0}
        subtext={`${kpis.unassignedTickets} unassigned awaiting triage`}
        icon={<Flame className="h-4 w-4" />}
        iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        label="In Progress"
        value={kpis.inProgressTickets}
        trend={`${kpis.pendingTickets} pending`}
        trendPositive
        subtext={`Avg. first response ${formatDuration(kpis.avgFirstResponseMinutes)}`}
        icon={<Clock className="h-4 w-4" />}
        iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        label="Avg. Resolution Time"
        value={formatDuration(kpis.avgResolutionMinutes)}
        trend="-14% faster"
        trendPositive
        subtext={`Team CSAT ${kpis.avgCsat} / 5.0`}
        icon={<CheckCircle2 className="h-4 w-4" />}
        iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
}
