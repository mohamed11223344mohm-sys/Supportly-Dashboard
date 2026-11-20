"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportRange } from "@/types";
import type { TicketVolumePoint } from "@/lib/analytics";

export function TicketVolumeChart({
  data,
  range,
  onRangeChange,
}: {
  data: TicketVolumePoint[];
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
}) {
  const isEmpty = data.every((d) => d.created === 0 && d.resolved === 0);

  return (
    <Card className="col-span-1 lg:col-span-7">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle>Ticket Volume & Resolution</CardTitle>
          <CardDescription>
            Incoming ticket volume compared against resolved requests
          </CardDescription>
        </div>
        <Tabs
          value={range}
          onValueChange={(v) => onRangeChange(v as ReportRange)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-[11px] px-2.5">
              7D
            </TabsTrigger>
            <TabsTrigger value="30d" className="text-[11px] px-2.5">
              30D
            </TabsTrigger>
            <TabsTrigger value="12m" className="text-[11px] px-2.5">
              12M
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3 flex items-center gap-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Created Tickets
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Resolved Tickets
          </span>
        </div>
        {isEmpty ? (
          <div className="flex h-[270px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/15 p-6 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/35 mb-2.5" />
            <p className="text-sm font-semibold text-foreground">No Ticket Activity</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              All tickets have been removed. Create a new support ticket to begin tracking volume and resolution metrics.
            </p>
          </div>
        ) : (
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={6}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradResolved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
