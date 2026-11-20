"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  Paperclip,
  Pencil,
  Phone,
  Send,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChannelBadge,
  PlanBadge,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badge";
import {
  FormattedDate,
  LiveSlaBadge,
  RelativeTime,
} from "@/components/shared/time-display";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { TicketActivityLog } from "@/components/tickets/ticket-activity-log";
import { useSupportStore } from "@/store/use-support-store";
import { cn } from "@/lib/utils";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/types";

const CANNED_MACROS = [
  {
    label: "Acknowledge & Investigate",
    body: "Thanks for reaching out! I've escalated this to our specialist team and we are actively investigating the logs. I'll update you within the next 30 minutes.",
  },
  {
    label: "Request Diagnostics",
    body: "Could you share a screenshot of the error along with the approximate UTC timestamp and workspace ID? That will let us pinpoint the root cause right away.",
  },
  {
    label: "Confirm Resolution",
    body: "We've deployed the fix and confirmed everything is operating normally on our side. Could you please verify on your end so we can mark this ticket resolved?",
  },
];

export function TicketDetailView({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const tickets = useSupportStore((s) => s.tickets);
  const customers = useSupportStore((s) => s.customers);
  const agents = useSupportStore((s) => s.agents);
  const updateTicket = useSupportStore((s) => s.updateTicket);
  const reassignTicket = useSupportStore((s) => s.reassignTicket);
  const deleteTicket = useSupportStore((s) => s.deleteTicket);
  const addTicketMessage = useSupportStore((s) => s.addTicketMessage);
  const deleteTicketMessage = useSupportStore((s) => s.deleteTicketMessage);
  const rateTicket = useSupportStore((s) => s.rateTicket);

  const ticket = tickets.find((t) => t.id === ticketId);
  const customer = customers.find((c) => c.id === ticket?.customerId);
  const customerTicketCount = tickets.filter(
    (t) => t.customerId === ticket?.customerId
  ).length;

  const [composerMode, setComposerMode] = React.useState<"reply" | "note">("reply");
  const [messageText, setMessageText] = React.useState("");
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null);

  if (!ticket) {
    return (
      <EmptyState
        icon={<ArrowLeft className="h-5 w-5" />}
        title={`Ticket ${ticketId} not found`}
        description="This ticket may have been deleted or the URL is incorrect."
        action={
          <Button asChild>
            <Link href="/tickets">Back to Tickets</Link>
          </Button>
        }
      />
    );
  }

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim()) return;
    const isInternal = composerMode === "note";
    addTicketMessage(ticket.id, messageText, isInternal);
    setMessageText("");
    toast.success(
      isInternal ? "Internal note added to thread" : "Reply sent to customer"
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tickets
          </Link>
          <span>/</span>
          <span className="font-mono font-semibold text-foreground">{ticket.id}</span>
          <LiveSlaBadge
            slaDueAt={ticket.slaDueAt}
            isResolvedOrClosed={
              ticket.status === "resolved" || ticket.status === "closed"
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
              onClick={() => {
                updateTicket(ticket.id, { status: "resolved" });
                toast.success(`${ticket.id} marked as Resolved`);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolve Ticket
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Ticket Summary + Thread + Composer */}
        <div className="space-y-5 lg:col-span-8">
          {/* Ticket Header Card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
                <ChannelBadge channel={ticket.channel} />
                <span className="text-xs text-muted-foreground ml-auto font-mono">
                  Created <RelativeTime date={ticket.createdAt} />
                </span>
              </div>

              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {ticket.subject}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {ticket.description}
                </p>
              </div>

              {ticket.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border bg-secondary/70 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation Thread */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conversation Thread ({ticket.messages.length})
              </h2>
            </div>

            {ticket.messages.map((msg) => {
              const isAgent = msg.senderType === "agent";
              const msgAgent = isAgent
                ? agents.find((a) => a.id === msg.senderId)
                : null;
              const avatarColor = msg.isInternal
                ? "bg-amber-600"
                : isAgent
                ? msgAgent?.avatarColor ?? "bg-indigo-600"
                : customer?.avatarColor ?? "bg-zinc-600";

              return (
                <Card
                  key={msg.id}
                  className={cn(
                    "transition-colors",
                    msg.isInternal
                      ? "border-amber-500/35 bg-amber-500/[0.06] dark:bg-amber-500/[0.08]"
                      : isAgent
                      ? "border-primary/20 bg-card"
                      : "bg-card"
                  )}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          name={msg.senderName}
                          color={avatarColor}
                          size="sm"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {msg.senderName}
                            </span>
                            {msg.isInternal ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                <Lock className="h-2.5 w-2.5" />
                                Internal Note
                              </span>
                            ) : isAgent ? (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                Support Team
                              </span>
                            ) : (
                              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Customer
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            <FormattedDate date={msg.createdAt} />
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-opacity"
                        onClick={() => setMessageToDelete(msg.id)}
                        title={msg.isInternal ? "Delete internal note" : "Delete reply"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">
                      {msg.content}
                    </p>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {att.name}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {att.size}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Reply / Internal Note Composer */}
          <Card
            className={cn(
              "overflow-hidden transition-colors",
              composerMode === "note" && "border-amber-500/40"
            )}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setComposerMode("reply")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    composerMode === "reply"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Public Reply
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode("note")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    composerMode === "note"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Lock className="h-3 w-3" />
                  Internal Note
                </button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Insert Macro
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  {CANNED_MACROS.map((m) => (
                    <DropdownMenuItem
                      key={m.label}
                      onClick={() => setMessageText(m.body)}
                    >
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <form onSubmit={handleSend} className="p-4 space-y-3">
              <Textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    handleSend();
                  }
                }}
                placeholder={
                  composerMode === "note"
                    ? "Write a private note for your teammates (not visible to the customer)..."
                    : `Reply to ${customer?.name ?? "customer"}...`
                }
                className={cn(
                  composerMode === "note" &&
                    "border-amber-500/30 bg-amber-500/[0.04] focus-visible:border-amber-500"
                )}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+Enter</kbd> to send
                </p>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!messageText.trim()}
                  className={cn(
                    composerMode === "note" &&
                      "bg-amber-600 text-white hover:bg-amber-700"
                  )}
                >
                  {composerMode === "note" ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Add Internal Note
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right: Inspector Panel (Properties, Customer, Activity Log) */}
        <div className="space-y-5 lg:col-span-4">
          {/* Ticket Properties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                Ticket Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => {
                    updateTicket(ticket.id, { status: v as TicketStatus });
                    toast.success("Ticket status updated");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => {
                    updateTicket(ticket.id, { priority: v as TicketPriority });
                    toast.success("Ticket priority updated");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select
                  value={ticket.assigneeId ?? "unassigned"}
                  onValueChange={(v) => {
                    const next = v === "unassigned" ? null : v;
                    reassignTicket(ticket.id, next);
                    toast.success(next ? "Ticket reassigned" : "Ticket unassigned");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned (Queue)</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {a.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={ticket.category}
                  onValueChange={(v) => {
                    updateTicket(ticket.id, { category: v as TicketCategory });
                    toast.success("Category updated");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "Technical",
                        "Billing",
                        "Account",
                        "Integrations",
                        "Bug Report",
                        "Feature Request",
                      ] as TicketCategory[]
                    ).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details Card */}
          {customer && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                  Customer Profile
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <Link href={`/customers/${customer.id}`}>
                    Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={customer.name}
                    color={customer.avatarColor}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {customer.role}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <PlanBadge plan={customer.plan} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-foreground">{customer.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{customer.location}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                    <p className="text-[11px] text-muted-foreground">Total Tickets</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">
                      {customerTicketCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                    <p className="text-[11px] text-muted-foreground">CSAT Rating</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">
                      {customer.satisfactionScore.toFixed(1)} / 5.0
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactive Customer CSAT Rating */}
          <Card>
            <CardHeader className="pb-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Customer Satisfaction
                </CardTitle>
                {ticket.csatRating ? (
                  <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {ticket.csatRating}.0 / 5.0
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Not rated</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {ticket.csatRating
                  ? "Customer survey rating for this resolution:"
                  : "Submit or update customer satisfaction rating:"}
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (ticket.csatRating || 0);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        rateTicket(ticket.id, star);
                        toast.success(`CSAT rated ${star}/5 stars! ⭐`);
                      }}
                      className="group rounded-md p-1 transition-transform hover:scale-125 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                      title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition-colors",
                          active
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/35 group-hover:text-amber-400"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <TicketActivityLog entries={ticket.activityLog} />
        </div>
      </div>

      <TicketModal open={editOpen} onOpenChange={setEditOpen} ticket={ticket} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ticket ${ticket.id}?`}
        description="This action cannot be undone. All replies and activity entries will be deleted."
        confirmLabel="Delete Ticket"
        destructive
        onConfirm={() => {
          deleteTicket(ticket.id);
          toast.success(`Deleted ticket ${ticket.id}`);
          router.push("/tickets");
        }}
      />

      <ConfirmDialog
        open={Boolean(messageToDelete)}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
        title="Delete message?"
        description="Are you sure you want to delete this message? This action will remove it from the ticket thread."
        confirmLabel="Delete Message"
        destructive
        onConfirm={() => {
          if (messageToDelete) {
            deleteTicketMessage(ticket.id, messageToDelete);
            toast.success("Message deleted successfully");
            setMessageToDelete(null);
          }
        }}
      />
    </div>
  );
}
