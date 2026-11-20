"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupportStore } from "@/store/use-support-store";
import { RelativeTime } from "@/components/shared/time-display";

export function RecentTicketsCard() {
  const tickets = useSupportStore((s) => s.tickets);
  const customers = useSupportStore((s) => s.customers);
  const agents = useSupportStore((s) => s.agents);

  const recent = React.useMemo(
    () =>
      [...tickets]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 6),
    [tickets]
  );

  return (
    <Card className="col-span-1 lg:col-span-7">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Latest customer requests requiring attention</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets">
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
            No tickets found. Create a ticket to view recent activity.
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {recent.map((ticket) => {
              const customer = customers.find((c) => c.id === ticket.customerId);
              const agent = agents.find((a) => a.id === ticket.assigneeId);

              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-primary">
                        {ticket.id}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">
                        {ticket.subject}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>{customer?.name ?? "Unknown"}</span>
                      <span>·</span>
                      <span>{customer?.company ?? ""}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">
                        <RelativeTime date={ticket.updatedAt} />
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <TicketPriorityBadge priority={ticket.priority} />
                    <TicketStatusBadge status={ticket.status} />
                    {agent ? (
                      <UserAvatar
                        name={agent.name}
                        color={agent.avatarColor}
                        size="xs"
                      />
                    ) : (
                      <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
