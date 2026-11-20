"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  Download,
  Star,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupportStore } from "@/store/use-support-store";
import {
  computeAgentPerformance,
  computeCategoryBreakdown,
  computeDashboardKPIs,
  computeDynamicCSAT,
  computePriorityBreakdown,
  computeStatusDistribution,
  computeVolumeSeries,
  filterTicketsByRange,
} from "@/lib/analytics";
import { exportToCsv, formatDuration } from "@/lib/utils";
import type { ReportRange } from "@/types";

const RANGE_LABELS: Record<ReportRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "12m": "Last 12 Months",
};

export function ReportsView() {
  const tickets = useSupportStore((s) => s.tickets);
  const agents = useSupportStore((s) => s.agents);
  const [range, setRange] = React.useState<ReportRange>("30d");

  // Dynamically filter tickets for the active timeframe window
  const periodTickets = React.useMemo(
    () => filterTicketsByRange(tickets, range),
    [tickets, range]
  );

  const kpis = React.useMemo(
    () => computeDashboardKPIs(periodTickets, agents),
    [periodTickets, agents]
  );
  const volumeSeries = React.useMemo(
    () => computeVolumeSeries(tickets, range, agents),
    [tickets, range, agents]
  );
  const statusData = React.useMemo(
    () => computeStatusDistribution(periodTickets),
    [periodTickets]
  );
  const categoryData = React.useMemo(
    () => computeCategoryBreakdown(periodTickets),
    [periodTickets]
  );
  const priorityData = React.useMemo(
    () => computePriorityBreakdown(periodTickets),
    [periodTickets]
  );
  const agentLeaderboard = React.useMemo(
    () =>
      computeAgentPerformance(tickets, agents).sort(
        (a, b) => b.resolutionRate - a.resolutionRate
      ),
    [tickets, agents]
  );
  const csatMetrics = React.useMemo(
    () => computeDynamicCSAT(periodTickets, 4.8, tickets, agents),
    [periodTickets, tickets, agents]
  );

  const totalPeriodVolume = volumeSeries.reduce((s, p) => s + p.created, 0);
  const totalPeriodResolved = volumeSeries.reduce((s, p) => s + p.resolved, 0);
  const periodResolutionRate =
    totalPeriodVolume > 0
      ? Math.round((totalPeriodResolved / totalPeriodVolume) * 100)
      : kpis.resolutionRate;
  const respondedPoints = volumeSeries.filter((p) => p.avgResponseMin > 0);
  const periodAvgResponse =
    respondedPoints.length > 0
      ? Math.round(
          respondedPoints.reduce((s, p) => s + p.avgResponseMin, 0) /
            respondedPoints.length
        )
      : kpis.avgFirstResponseMinutes;

  const isVolumeEmpty = volumeSeries.every((d) => d.created === 0 && d.resolved === 0);
  const isResponseEmpty = volumeSeries.every((d) => d.avgResponseMin === 0);

  const handleExportReport = () => {
    exportToCsv(
      `supportly-report-${range}.csv`,
      agentLeaderboard.map((a) => ({
        Agent: a.name,
        Role: a.role,
        Status: a.status,
        ActiveTickets: a.assignedActive,
        ResolvedTickets: a.resolvedCount,
        ResolutionRatePct: a.resolutionRate,
        AvgResponseMin: a.avgResponseMinutes,
        CSAT: a.csatScore,
      }))
    );
    toast.success(`Exported ${RANGE_LABELS[range]} performance report`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description={`Support operations metrics, SLA compliance, and team efficiency for ${RANGE_LABELS[range].toLowerCase()}.`}
        actions={
          <>
            <Tabs
              value={range}
              onValueChange={(v) => setRange(v as ReportRange)}
            >
              <TabsList>
                <TabsTrigger value="7d">7D</TabsTrigger>
                <TabsTrigger value="30d">30D</TabsTrigger>
                <TabsTrigger value="90d">90D</TabsTrigger>
                <TabsTrigger value="12m">12M</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Tickets (${RANGE_LABELS[range]})`}
          value={totalPeriodVolume}
          trend="+9.4%"
          subtext={`${totalPeriodResolved} resolved in period`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Resolution Rate"
          value={`${periodResolutionRate}%`}
          trend="+3.1%"
          subtext={`Live queue: ${kpis.resolvedOrClosedTickets}/${kpis.totalTickets} resolved`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Avg. First Response"
          value={formatDuration(periodAvgResponse)}
          trend="-11% faster"
          subtext={`Avg. full resolution: ${formatDuration(kpis.avgResolutionMinutes)}`}
          icon={<Clock className="h-4 w-4" />}
          iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Customer Satisfaction"
          value={`${csatMetrics.score} / 5.0`}
          trend={`${csatMetrics.positivePercent}% positive`}
          trendPositive={csatMetrics.positivePercent >= 80}
          subtext={`Based on ${csatMetrics.totalRated} rated tickets`}
          icon={<Star className="h-4 w-4" />}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Created vs Resolved Area Chart */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Ticket Intake vs. Resolution</CardTitle>
            <CardDescription>
              Volume trajectory for {RANGE_LABELS[range].toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVolumeEmpty ? (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/15 p-6 text-center">
                <TrendingUp className="h-9 w-9 text-muted-foreground/35 mb-2.5" />
                <p className="text-sm font-semibold text-foreground">No Ticket Activity</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  No ticket intake or resolution recorded for {RANGE_LABELS[range].toLowerCase()}.
                </p>
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={volumeSeries}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="repCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="repResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Created"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#repCreated)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name="Resolved"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#repResolved)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* First Response Time Trend */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>First Response Speed (min)</CardTitle>
            <CardDescription>
              Lower is better — target under 20 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResponseEmpty ? (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/15 p-6 text-center">
                <Clock className="h-9 w-9 text-muted-foreground/35 mb-2.5" />
                <p className="text-sm font-semibold text-foreground">No Response Speed Data</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  No ticket response times recorded for this timeframe.
                </p>
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={volumeSeries}
                    margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                  >
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
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgResponseMin"
                      name="Avg. Response (min)"
                      stroke="#0ea5e9"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#0ea5e9" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Row: 4 Dynamic Metric Modules with Live Progress Bars */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current queue status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={74}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
              {statusData.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1"
                >
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Share of requests by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {categoryData.slice(0, 5).map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground truncate max-w-[140px]">
                    {cat.category}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {cat.count} ({cat.percent}%)
                  </span>
                </div>
                <Progress value={cat.percent} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Volume by urgency level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {priorityData.map((pr) => (
              <div key={pr.priority} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: pr.color }}
                    />
                    {pr.name}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {pr.count} ({pr.percent}%)
                  </span>
                </div>
                <Progress
                  value={pr.percent}
                  indicatorClassName={
                    pr.priority === "urgent"
                      ? "bg-rose-500"
                      : pr.priority === "high"
                      ? "bg-orange-500"
                      : pr.priority === "medium"
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>CSAT Ratings</CardTitle>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-500">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {csatMetrics.score}
              </span>
            </div>
            <CardDescription>
              {csatMetrics.totalRated} rated tickets in period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {csatMetrics.distribution.map((item) => (
              <div key={item.star} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {item.count} ({item.percent}%)
                  </span>
                </div>
                <Progress
                  value={item.percent}
                  indicatorClassName={
                    item.star === 5
                      ? "bg-emerald-500"
                      : item.star === 4
                      ? "bg-teal-500"
                      : item.star === 3
                      ? "bg-amber-500"
                      : item.star === 2
                      ? "bg-orange-500"
                      : "bg-rose-500"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Leaderboard */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Agent Performance Leaderboard</CardTitle>
          <CardDescription>
            Individual ticket resolution, response speed, and customer satisfaction scores
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/35">
            <TableRow className="hover:bg-transparent">
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active Queue</TableHead>
              <TableHead>Resolved</TableHead>
              <TableHead>Avg. Response</TableHead>
              <TableHead>Resolution Rate</TableHead>
              <TableHead className="text-right">CSAT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentLeaderboard.map((row) => {
              const agent = agents.find((a) => a.id === row.agentId);
              return (
                <TableRow key={row.agentId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={row.name}
                        color={agent?.avatarColor}
                        size="sm"
                        status={row.status}
                      />
                      <div>
                        <p className="text-sm font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AgentStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.assignedActive}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {row.resolvedCount}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.avgResponseMinutes}m
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5 w-36">
                      <Progress value={row.resolutionRate} className="h-1.5" />
                      <span className="font-mono text-xs font-medium">
                        {row.resolutionRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {row.csatScore.toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
