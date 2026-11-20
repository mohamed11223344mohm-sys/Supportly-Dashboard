"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, Bot, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupportStore } from "@/store/use-support-store";
import { RelativeTime } from "@/components/shared/time-display";

export function ActivityFeedCard() {
  const tickets = useSupportStore((s) => s.tickets);

  const activities = React.useMemo(() => {
    return tickets
      .flatMap((t) =>
        t.activityLog.map((entry) => ({
          ...entry,
          ticketSubject: t.subject,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 7);
  }, [tickets]);

  return (
    <Card className="col-span-1 lg:col-span-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Live Activity Feed
        </CardTitle>
        <CardDescription>Real-time updates across tickets & team actions</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
            No recent activity logged yet.
          </div>
        ) : (
          <ol className="relative space-y-4 border-l border-border ml-3 pl-5">
            {activities.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[29px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                  {item.actorType === "system" ? (
                    <Bot className="h-3 w-3 text-primary" />
                  ) : item.actorType === "customer" ? (
                    <MessageSquare className="h-3 w-3 text-blue-500" />
                  ) : (
                    <User className="h-3 w-3 text-emerald-500" />
                  )}
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs leading-relaxed text-foreground">
                    <span className="font-semibold">{item.actorName}</span>{" "}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Link
                      href={`/tickets/${item.ticketId}`}
                      className="font-mono font-medium text-primary hover:underline"
                    >
                      {item.ticketId}
                    </Link>
                    <span>·</span>
                    <RelativeTime date={item.createdAt} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
