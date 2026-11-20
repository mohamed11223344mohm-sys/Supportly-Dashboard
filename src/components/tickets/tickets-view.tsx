"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Ticket as TicketIcon,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChannelBadge,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badge";
import { LiveSlaBadge, RelativeTime } from "@/components/shared/time-display";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { useSupportStore } from "@/store/use-support-store";
import { cn, exportToCsv } from "@/lib/utils";
import type { Ticket, TicketPriority, TicketStatus } from "@/types";

const STATUS_TABS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All Tickets" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function TicketsView() {
  const searchParams = useSearchParams();
  const initialAssignee = searchParams.get("assignee") || "all";

  const tickets = useSupportStore((s) => s.tickets);
  const customers = useSupportStore((s) => s.customers);
  const agents = useSupportStore((s) => s.agents);
  const updateTicket = useSupportStore((s) => s.updateTicket);
  const deleteTicket = useSupportStore((s) => s.deleteTicket);
  const reassignTicket = useSupportStore((s) => s.reassignTicket);
  const compactDensity = useSupportStore((s) => s.settings.compactDensity);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = React.useState<TicketPriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>(initialAssignee);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingTicket, setEditingTicket] = React.useState<Ticket | null>(null);
  const [deletingTicketId, setDeletingTicketId] = React.useState<string | null>(null);

  const filteredTickets = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets
      .filter((t) => {
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (assigneeFilter === "unassigned" && t.assigneeId !== null) return false;
        if (
          assigneeFilter !== "all" &&
          assigneeFilter !== "unassigned" &&
          t.assigneeId !== assigneeFilter
        ) {
          return false;
        }
        if (q) {
          const customer = customers.find((c) => c.id === t.customerId);
          const haystack = [
            t.id,
            t.subject,
            t.category,
            customer?.name ?? "",
            customer?.company ?? "",
            ...t.tags,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [tickets, customers, search, statusFilter, priorityFilter, assigneeFilter]);

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  };

  const toggleAllVisible = () => {
    if (selectedIds.length === filteredTickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTickets.map((t) => t.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = (status: TicketStatus) => {
    selectedIds.forEach((id) => updateTicket(id, { status }));
    toast.success(`Updated ${selectedIds.length} tickets to ${status.replace("_", " ")}`);
    setSelectedIds([]);
  };

  const handleBulkAssign = (agentId: string) => {
    const normalized = agentId === "unassigned" ? null : agentId;
    selectedIds.forEach((id) => reassignTicket(id, normalized));
    toast.success(`Reassigned ${selectedIds.length} tickets`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteTicket(id));
    toast.success(`Deleted ${selectedIds.length} tickets`);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const rows = filteredTickets.map((t) => {
      const customer = customers.find((c) => c.id === t.customerId);
      const agent = agents.find((a) => a.id === t.assigneeId);
      return {
        ID: t.id,
        Subject: t.subject,
        Customer: customer?.name ?? "",
        Company: customer?.company ?? "",
        Status: t.status,
        Priority: t.priority,
        Category: t.category,
        Assignee: agent?.name ?? "Unassigned",
        Created: t.createdAt,
      };
    });
    exportToCsv("supportly-tickets.csv", rows);
    toast.success(`Exported ${rows.length} tickets to CSV`);
  };

  const countForStatus = (status: TicketStatus | "all") =>
    status === "all"
      ? tickets.length
      : tickets.filter((t) => t.status === status).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tickets"
        description="Manage, prioritize, and route customer support tickets across your team."
        badge={
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {tickets.length}
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTicket(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Ticket
            </Button>
          </>
        }
      />

      {/* Status Quick Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          const count = countForStatus(tab.value);
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "relative inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
                  active
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {count}
              </span>
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <Card className="p-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, subject, customer, or tag..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filter:</span>
            </div>

            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as TicketPriority | "all")}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="h-9 w-[165px] text-xs">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned Queue</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/[0.05] px-3.5 py-2">
            <p className="text-xs font-medium text-foreground">
              <span className="font-mono font-semibold text-primary">
                {selectedIds.length}
              </span>{" "}
              selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleBulkStatus("resolved")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Mark Resolved
              </Button>

              <Select onValueChange={handleBulkAssign}>
                <SelectTrigger className="h-7 w-[150px] text-xs">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassign</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-5 w-5" />}
          title="No tickets match your filters"
          description="Try clearing your search query or adjusting the status, priority, or assignee filters."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear all filters
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/35">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      filteredTickets.length > 0 &&
                      selectedIds.length === filteredTickets.length
                    }
                    onCheckedChange={toggleAllVisible}
                    aria-label="Select all tickets"
                  />
                </TableHead>
                <TableHead className="min-w-[280px]">Ticket</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const customer = customers.find((c) => c.id === ticket.customerId);
                const agent = agents.find((a) => a.id === ticket.assigneeId);
                const isSelected = selectedIds.includes(ticket.id);

                return (
                  <TableRow
                    key={ticket.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(compactDensity && "[&>td]:py-1.5 [&>td]:text-xs")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(ticket.id)}
                        aria-label={`Select ${ticket.id}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 max-w-[360px]">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="font-mono text-xs font-semibold text-primary hover:underline shrink-0"
                          >
                            {ticket.id}
                          </Link>
                          <ChannelBadge channel={ticket.channel} />
                          <span className="text-[11px] text-muted-foreground">
                            {ticket.category}
                          </span>
                        </div>
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="block truncate text-sm font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {ticket.subject}
                        </Link>
                      </div>
                    </TableCell>

                    <TableCell>
                      {customer ? (
                        <Link
                          href={`/customers/${customer.id}`}
                          className="flex items-center gap-2.5 group"
                        >
                          <UserAvatar
                            name={customer.name}
                            color={customer.avatarColor}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-foreground group-hover:text-primary">
                              {customer.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {customer.company}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="cursor-pointer focus:outline-none">
                            <TicketStatusBadge status={ticket.status} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {(
                            ["open", "in_progress", "pending", "resolved", "closed"] as TicketStatus[]
                          ).map((st) => (
                            <DropdownMenuItem
                              key={st}
                              onClick={() => {
                                updateTicket(ticket.id, { status: st });
                                toast.success(`${ticket.id} status updated`);
                              }}
                            >
                              <TicketStatusBadge status={st} />
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="cursor-pointer focus:outline-none">
                            <TicketPriorityBadge priority={ticket.priority} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {(["urgent", "high", "medium", "low"] as TicketPriority[]).map(
                            (pr) => (
                              <DropdownMenuItem
                                key={pr}
                                onClick={() => {
                                  updateTicket(ticket.id, { priority: pr });
                                  toast.success(`${ticket.id} priority set to ${pr}`);
                                }}
                              >
                                <TicketPriorityBadge priority={pr} />
                              </DropdownMenuItem>
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent cursor-pointer"
                          >
                            {agent ? (
                              <>
                                <UserAvatar
                                  name={agent.name}
                                  color={agent.avatarColor}
                                  size="xs"
                                  status={agent.status}
                                />
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                                  {agent.name}
                                </span>
                              </>
                            ) : (
                              <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
                                + Assign
                              </span>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              reassignTicket(ticket.id, null);
                              toast.info(`${ticket.id} unassigned`);
                            }}
                          >
                            Unassigned (Queue)
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {agents.map((a) => (
                            <DropdownMenuItem
                              key={a.id}
                              onClick={() => {
                                reassignTicket(ticket.id, a.id);
                                toast.success(`${ticket.id} assigned to ${a.name}`);
                              }}
                            >
                              <UserAvatar
                                name={a.name}
                                color={a.avatarColor}
                                size="xs"
                                status={a.status}
                              />
                              <span className="truncate">{a.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                    <TableCell>
                      <LiveSlaBadge
                        slaDueAt={ticket.slaDueAt}
                        isResolvedOrClosed={
                          ticket.status === "resolved" ||
                          ticket.status === "closed"
                        }
                      />
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                      <RelativeTime date={ticket.updatedAt} />
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tickets/${ticket.id}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open Ticket
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingTicket(ticket);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Ticket
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingTicketId(ticket.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <TicketModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ticket={editingTicket}
      />

      <ConfirmDialog
        open={Boolean(deletingTicketId)}
        onOpenChange={(open) => !open && setDeletingTicketId(null)}
        title={`Delete ticket ${deletingTicketId}?`}
        description="This permanently removes the ticket, its conversation history, and activity log from your workspace."
        confirmLabel="Delete Ticket"
        destructive
        onConfirm={() => {
          if (deletingTicketId) {
            deleteTicket(deletingTicketId);
            toast.success(`Deleted ticket ${deletingTicketId}`);
            setDeletingTicketId(null);
          }
        }}
      />
    </div>
  );
}
