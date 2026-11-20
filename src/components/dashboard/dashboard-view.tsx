"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Inbox, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { TicketVolumeChart } from "@/components/dashboard/ticket-volume-chart";
import { TeamPerformanceChart } from "@/components/dashboard/team-performance-chart";
import { RecentTicketsCard } from "@/components/dashboard/recent-tickets-card";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed-card";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { useSupportStore } from "@/store/use-support-store";
import {
  computeAgentPerformance,
  computeDashboardKPIs,
  computeVolumeSeries,
} from "@/lib/analytics";
import type { ReportRange } from "@/types";

export function DashboardView() {
  const tickets = useSupportStore((s) => s.tickets);
  const agents = useSupportStore((s) => s.agents);
  const profileName = useSupportStore((s) => s.settings.profile.name);

  const [range, setRange] = React.useState<ReportRange>("7d");
  const [newTicketOpen, setNewTicketOpen] = React.useState(false);

  const kpis = React.useMemo(
    () => computeDashboardKPIs(tickets, agents),
    [tickets, agents]
  );
  const volumeData = React.useMemo(
    () => computeVolumeSeries(tickets, range, agents),
    [tickets, range, agents]
  );
  const agentMetrics = React.useMemo(
    () => computeAgentPerformance(tickets, agents),
    [tickets, agents]
  );

  const firstName = profileName.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good afternoon, ${firstName}`}
        description="Here's what's happening across your support queue and team performance today."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/inbox">
                <Inbox className="h-3.5 w-3.5" />
                Open Inbox
              </Link>
            </Button>
            <Button size="sm" onClick={() => setNewTicketOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Create Ticket
            </Button>
          </>
        }
      />

      {kpis.unassignedTickets > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs sm:text-sm text-foreground">
              <span className="font-semibold">
                {kpis.unassignedTickets} unassigned{" "}
                {kpis.unassignedTickets === 1 ? "ticket" : "tickets"}
              </span>{" "}
              in the intake queue awaiting agent assignment.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <Link href="/tickets?assignee=unassigned">
              Triage queue
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <TicketVolumeChart
          data={volumeData}
          range={range}
          onRangeChange={setRange}
        />
        <TeamPerformanceChart data={agentMetrics} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <RecentTicketsCard />
        <ActivityFeedCard />
      </div>

      <TicketModal open={newTicketOpen} onOpenChange={setNewTicketOpen} />
    </div>
  );
}
