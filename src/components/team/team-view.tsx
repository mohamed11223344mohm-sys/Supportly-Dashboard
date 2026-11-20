"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Clock,
  Layers,
  Pencil,
  Plus,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AgentStatusBadge,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSupportStore } from "@/store/use-support-store";
import { computeAgentPerformance } from "@/lib/analytics";
import { EditAgentDialog } from "@/components/team/edit-agent-dialog";
import type { Agent, AgentRole, AgentStatus, Ticket } from "@/types";

export function TeamView() {
  const agents = useSupportStore((s) => s.agents);
  const tickets = useSupportStore((s) => s.tickets);
  const customers = useSupportStore((s) => s.customers);
  const updateAgentStatus = useSupportStore((s) => s.updateAgentStatus);
  const adjustAgentCapacity = useSupportStore((s) => s.adjustAgentCapacity);
  const addAgent = useSupportStore((s) => s.addAgent);
  const reassignTicket = useSupportStore((s) => s.reassignTicket);
  const deleteTicket = useSupportStore((s) => s.deleteTicket);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] = React.useState<Agent | null>(null);
  const [ticketToDelete, setTicketToDelete] = React.useState<Ticket | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<AgentRole>("Support Agent");
  const [department, setDepartment] = React.useState("Customer Support");
  const [skillsInput, setSkillsInput] = React.useState("");

  const metrics = React.useMemo(
    () => computeAgentPerformance(tickets, agents),
    [tickets, agents]
  );

  const activeQueueTickets = React.useMemo(
    () =>
      tickets
        .filter((t) => t.status !== "resolved" && t.status !== "closed")
        .sort((a, b) => {
          if (!a.assigneeId && b.assigneeId) return -1;
          if (a.assigneeId && !b.assigneeId) return 1;
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }),
    [tickets]
  );

  const onlineAgents = agents.filter((a) => a.status === "online").length;
  const unassignedCount = activeQueueTickets.filter((t) => !t.assigneeId).length;
  const avgResponse =
    agents.length > 0
      ? Math.round(
          agents.reduce((sum, a) => sum + a.avgResponseMinutes, 0) / agents.length
        )
      : 0;

  const handleAutoBalance = () => {
    const unassigned = activeQueueTickets.filter((t) => !t.assigneeId);
    if (unassigned.length === 0) {
      toast.info("All active tickets are already assigned!");
      return;
    }

    const availableAgents = agents.filter(
      (a) => a.status === "online" || a.status === "busy"
    );
    const pool = availableAgents.length > 0 ? availableAgents : agents;

    // Sort pool by lowest current active load
    const loadMap = new Map<string, number>();
    pool.forEach((a) => {
      const load = tickets.filter(
        (t) =>
          t.assigneeId === a.id &&
          t.status !== "resolved" &&
          t.status !== "closed"
      ).length;
      loadMap.set(a.id, load);
    });

    unassigned.forEach((ticket) => {
      const leastBusy = [...pool].sort(
        (a, b) => (loadMap.get(a.id) ?? 0) - (loadMap.get(b.id) ?? 0)
      )[0];
      if (leastBusy) {
        reassignTicket(ticket.id, leastBusy.id);
        loadMap.set(leastBusy.id, (loadMap.get(leastBusy.id) ?? 0) + 1);
      }
    });

    toast.success(`Auto-distributed ${unassigned.length} unassigned tickets across online agents`);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter name and email.");
      return;
    }
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const created = addAgent({
      name,
      email,
      role,
      department,
      skills,
    });
    toast.success(`${created.name} joined your support team`);
    setName("");
    setEmail("");
    setRole("Support Agent");
    setDepartment("Customer Support");
    setSkillsInput("");
    setInviteOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description="Monitor agent availability, workload capacity, and balance ticket assignments."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleAutoBalance}>
              <Shuffle className="h-3.5 w-3.5" />
              Auto-Balance Queue ({unassignedCount})
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Invite Agent
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Team Members"
          value={agents.length}
          subtext={`${onlineAgents} currently online`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Online Availability"
          value={`${Math.round((onlineAgents / Math.max(1, agents.length)) * 100)}%`}
          subtext="Ready for live intake"
          icon={<UserCheck className="h-4 w-4" />}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Active Workload"
          value={activeQueueTickets.length}
          subtext={`${unassignedCount} unassigned in queue`}
          icon={<Layers className="h-4 w-4" />}
          iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Team Avg. Response"
          value={`${avgResponse}m`}
          trend="-3m vs last wk"
          subtext="First reply SLA target: 30m"
          icon={<Clock className="h-4 w-4" />}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Agent Roster Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => {
          const perf = metrics.find((m) => m.agentId === agent.id);
          const activeCount = perf?.assignedActive ?? 0;
          const resolvedCount = perf?.resolvedCount ?? 0;
          const capacityPct = perf?.capacityPercent ?? 0;

          return (
            <Card
              key={agent.id}
              className="transition-all duration-150 hover:border-primary/30"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      name={agent.name}
                      color={agent.avatarColor}
                      size="md"
                      status={agent.status}
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {agent.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {agent.role} · {agent.department}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground/80">
                        {agent.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => setEditingAgent(agent)}
                      title={`Edit ${agent.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Select
                      value={agent.status}
                      onValueChange={(v) => {
                        updateAgentStatus(agent.id, v as AgentStatus);
                        toast.success(`${agent.name} status set to ${v}`);
                      }}
                    >
                      <SelectTrigger className="h-7 w-[104px] text-xs px-2">
                        <AgentStatusBadge status={agent.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Workload Capacity */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Queue Capacity</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium text-foreground">
                        {activeCount} / {agent.maxCapacity} active
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        ({capacityPct}%)
                      </span>
                      <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5 ml-0.5">
                        <button
                          type="button"
                          title="Decrease capacity"
                          onClick={() => {
                            adjustAgentCapacity(agent.id, -1);
                            toast.info(
                              `${agent.name} capacity set to ${Math.max(
                                1,
                                (agent.maxCapacity || 8) - 1
                              )}`
                            );
                          }}
                          disabled={agent.maxCapacity <= 1}
                          className="flex h-4 w-4 items-center justify-center rounded text-xs hover:bg-muted disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          title="Increase capacity"
                          onClick={() => {
                            adjustAgentCapacity(agent.id, 1);
                            toast.info(
                              `${agent.name} capacity set to ${Math.min(
                                25,
                                (agent.maxCapacity || 8) + 1
                              )}`
                            );
                          }}
                          disabled={agent.maxCapacity >= 25}
                          className="flex h-4 w-4 items-center justify-center rounded text-xs hover:bg-muted cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={capacityPct}
                    indicatorClassName={
                      capacityPct >= 85
                        ? "bg-rose-500"
                        : capacityPct >= 60
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    }
                  />
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Resolved</p>
                    <p className="font-mono text-sm font-semibold">
                      {resolvedCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Avg. Reply</p>
                    <p className="font-mono text-sm font-semibold">
                      {agent.avgResponseMinutes}m
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CSAT</p>
                    <p className="inline-flex items-center justify-center gap-0.5 font-mono text-sm font-semibold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {agent.csatScore.toFixed(1)}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {agent.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Ticket Distribution Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Active Ticket Distribution
            </CardTitle>
            <CardDescription>
              Reassign open, in-progress, or pending tickets between agents in real time
            </CardDescription>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
            {activeQueueTickets.length} active
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/70">
            {activeQueueTickets.map((ticket) => {
              const customer = customers.find((c) => c.id === ticket.customerId);
              return (
                <div
                  key={ticket.id}
                  className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {ticket.id}
                      </Link>
                      <TicketPriorityBadge priority={ticket.priority} />
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="block truncate text-sm font-medium text-foreground hover:text-primary"
                    >
                      {ticket.subject}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {customer?.name} · {customer?.company}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Select
                      value={ticket.assigneeId ?? "unassigned"}
                      onValueChange={(v) => {
                        const next = v === "unassigned" ? null : v;
                        const target = agents.find((a) => a.id === next);
                        reassignTicket(ticket.id, next);
                        toast.success(
                          target
                            ? `Assigned ${ticket.id} to ${target.name}`
                            : `Moved ${ticket.id} to unassigned queue`
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 w-[190px] text-xs">
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned (Queue)</SelectItem>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ({a.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      onClick={() => setTicketToDelete(ticket)}
                      title="Delete ticket"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new support specialist to your Supportly workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="Jordan Blake"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Work Email</Label>
              <Input
                type="email"
                placeholder="jordan.blake@supportly.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AgentRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Support Lead">Support Lead</SelectItem>
                    <SelectItem value="Senior Agent">Senior Agent</SelectItem>
                    <SelectItem value="Technical Specialist">
                      Technical Specialist
                    </SelectItem>
                    <SelectItem value="Support Agent">Support Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Skills (comma separated)</Label>
              <Input
                placeholder="Billing, API, Webhooks"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Send Invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EditAgentDialog
        agent={editingAgent}
        open={Boolean(editingAgent)}
        onOpenChange={(open) => !open && setEditingAgent(null)}
        activeTicketsCount={
          editingAgent
            ? tickets.filter(
                (t) =>
                  t.assigneeId === editingAgent.id &&
                  t.status !== "resolved" &&
                  t.status !== "closed"
              ).length
            : 0
        }
      />

      <ConfirmDialog
        open={Boolean(ticketToDelete)}
        onOpenChange={(open) => !open && setTicketToDelete(null)}
        title={`Delete Ticket #${ticketToDelete?.id}?`}
        description={`Are you sure you want to delete "${ticketToDelete?.subject}"? This action permanently removes the ticket from the system.`}
        confirmLabel="Delete Ticket"
        destructive
        onConfirm={() => {
          if (ticketToDelete) {
            deleteTicket(ticketToDelete.id);
            toast.success(`Ticket ${ticketToDelete.id} deleted successfully`);
            setTicketToDelete(null);
          }
        }}
      />
    </div>
  );
}
