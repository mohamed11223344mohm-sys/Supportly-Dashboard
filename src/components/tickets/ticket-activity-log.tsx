"use client";

import * as React from "react";
import { Bot, Clock, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedDate } from "@/components/shared/time-display";
import type { ActivityLogEntry } from "@/types";

export function TicketActivityLog({ entries }: { entries: ActivityLogEntry[] }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Activity Log ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-2.5 space-y-4 border-l border-border pl-4">
          {sorted.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[25px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                {entry.actorType === "system" ? (
                  <Bot className="h-2.5 w-2.5 text-primary" />
                ) : entry.actorType === "customer" ? (
                  <MessageSquare className="h-2.5 w-2.5 text-blue-500" />
                ) : (
                  <User className="h-2.5 w-2.5 text-emerald-500" />
                )}
              </span>
              <p className="text-xs leading-snug text-foreground">
                <span className="font-semibold">{entry.actorName}</span>{" "}
                <span className="text-muted-foreground">{entry.action}</span>
              </p>
              {entry.details && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {entry.details}
                </p>
              )}
              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
                <FormattedDate date={entry.createdAt} />
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
