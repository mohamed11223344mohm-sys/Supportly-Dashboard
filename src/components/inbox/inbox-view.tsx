"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox as InboxIcon,
  Lock,
  Mail,
  MapPin,
  Plus,
  Search,
  Send,
  Ticket as TicketIcon,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  ChannelBadge,
  PlanBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime, ShortTime } from "@/components/shared/time-display";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSupportStore } from "@/store/use-support-store";
import { cn } from "@/lib/utils";
import type { Conversation, TicketChannel } from "@/types";

const QUICK_REPLIES = [
  "Looking into this right now!",
  "Could you share a screenshot or trace ID?",
  "Fix deployed — could you refresh and confirm?",
];

export function InboxView() {
  const conversations = useSupportStore((s) => s.conversations);
  const customers = useSupportStore((s) => s.customers);
  const agents = useSupportStore((s) => s.agents);
  const tickets = useSupportStore((s) => s.tickets);
  const sendInboxMessage = useSupportStore((s) => s.sendInboxMessage);
  const deleteInboxMessage = useSupportStore((s) => s.deleteInboxMessage);
  const markConversationRead = useSupportStore((s) => s.markConversationRead);
  const markConversationUnread = useSupportStore((s) => s.markConversationUnread);
  const updateConversationStatus = useSupportStore(
    (s) => s.updateConversationStatus
  );
  const assignConversation = useSupportStore((s) => s.assignConversation);
  const createConversation = useSupportStore((s) => s.createConversation);

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "open" | "unread" | "snoozed" | "closed">(
    "all"
  );
  const [activeId, setActiveId] = React.useState<string>(conversations[0]?.id ?? "");
  const [mobileShowChat, setMobileShowChat] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [isWhisper, setIsWhisper] = React.useState(false);
  const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null);

  // Compose new thread state
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [composeCustomer, setComposeCustomer] = React.useState(customers[0]?.id || "");
  const [composeSubject, setComposeSubject] = React.useState("");
  const [composeChannel, setComposeChannel] = React.useState<TicketChannel>("chat");
  const [composeMessage, setComposeMessage] = React.useState("");

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + (c.unreadCount > 0 ? 1 : 0),
    0
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations
      .filter((c) => {
        if (filter === "unread" && c.unreadCount === 0) return false;
        if (
          filter !== "all" &&
          filter !== "unread" &&
          c.status !== filter
        ) {
          return false;
        }
        if (q) {
          const customer = customers.find((cu) => cu.id === c.customerId);
          const hay = [
            c.subject,
            customer?.name ?? "",
            customer?.company ?? "",
            c.messages[c.messages.length - 1]?.content ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
  }, [conversations, customers, search, filter]);

  const activeConv =
    conversations.find((c) => c.id === activeId) ?? filtered[0] ?? null;
  const activeCustomer = activeConv
    ? customers.find((c) => c.id === activeConv.customerId)
    : null;
  const linkedTicket = activeConv?.ticketId
    ? tickets.find((t) => t.id === activeConv.ticketId)
    : null;

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.id, activeConv?.messages.length]);

  const selectConversation = (conv: Conversation) => {
    setActiveId(conv.id);
    setMobileShowChat(true);
    if (conv.unreadCount > 0) {
      markConversationRead(conv.id);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeConv || !draft.trim()) return;
    sendInboxMessage(activeConv.id, draft, isWhisper);
    setDraft("");
    if (isWhisper) {
      toast.success("Internal note added");
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-6.5rem)] min-h-[580px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Inbox
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Real-time customer conversations across Live Chat, Email, and Slack Connect.
          </p>
        </div>
      </div>

      <Card className="flex flex-1 overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div
          className={cn(
            "w-full flex-col border-r border-border sm:flex sm:w-80 lg:w-[320px] shrink-0",
            mobileShowChat ? "hidden" : "flex"
          )}
        >
          <div className="p-3 border-b border-border space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                className="h-8 px-2.5 text-xs gap-1 shrink-0"
                onClick={() => {
                  setComposeCustomer(customers[0]?.id || "");
                  setComposeSubject("");
                  setComposeMessage("");
                  setComposeOpen(true);
                }}
                title="Start new conversation"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {(["all", "open", "unread", "snoozed", "closed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors cursor-pointer",
                    filter === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span>{tab}</span>
                  {tab === "unread" && totalUnreadCount > 0 && (
                    <span className="rounded-full bg-primary/20 px-1 py-0.2 font-mono text-[9px] font-semibold text-primary">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/70">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No conversations match this filter.
              </div>
            ) : (
              filtered.map((conv) => {
                const customer = customers.find((c) => c.id === conv.customerId);
                const lastMsg = conv.messages[conv.messages.length - 1];
                const isActive = activeConv?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => selectConversation(conv)}
                    className={cn(
                      "flex w-full items-start gap-3 p-3.5 text-left transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/[0.07] dark:bg-primary/[0.12]"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <UserAvatar
                      name={customer?.name ?? "Customer"}
                      color={customer?.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {customer?.name ?? "Unknown"}
                        </p>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          <RelativeTime date={conv.lastMessageAt} />
                        </span>
                      </div>
                      <p className="truncate text-xs font-medium text-foreground/85 mt-0.5">
                        {conv.subject}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] text-muted-foreground">
                          {lastMsg?.content ?? "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Pane: Chat Stream */}
        {activeConv && activeCustomer ? (
          <div
            className={cn(
              "flex-1 flex-col min-w-0 bg-background/40 sm:flex",
              mobileShowChat ? "flex" : "hidden"
            )}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="sm:hidden shrink-0"
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <UserAvatar
                  name={activeCustomer.name}
                  color={activeCustomer.avatarColor}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground">
                      {activeCustomer.name}
                    </h2>
                    <ChannelBadge channel={activeConv.channel} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {activeConv.subject}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => {
                    if (activeConv.unreadCount > 0) {
                      markConversationRead(activeConv.id);
                      toast.success("Conversation marked as read");
                    } else {
                      markConversationUnread(activeConv.id);
                      toast.success("Conversation marked as unread");
                    }
                  }}
                  title={
                    activeConv.unreadCount > 0
                      ? "Mark conversation as read"
                      : "Mark conversation as unread"
                  }
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">
                    {activeConv.unreadCount > 0 ? "Mark Read" : "Mark Unread"}
                  </span>
                </Button>

                <Select
                  value={activeConv.assigneeId ?? "unassigned"}
                  onValueChange={(v) => {
                    assignConversation(
                      activeConv.id,
                      v === "unassigned" ? null : v
                    );
                    toast.success("Conversation assignee updated");
                  }}
                >
                  <SelectTrigger className="h-8 w-[145px] text-xs">
                    <SelectValue placeholder="Assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeConv.status !== "snoozed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      updateConversationStatus(activeConv.id, "snoozed");
                      toast.info("Conversation snoozed");
                    }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Snooze</span>
                  </Button>
                )}

                <Button
                  variant={activeConv.status === "closed" ? "outline" : "default"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    const next = activeConv.status === "closed" ? "open" : "closed";
                    updateConversationStatus(activeConv.id, next);
                    toast.success(
                      next === "closed"
                        ? "Conversation closed"
                        : "Conversation reopened"
                    );
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">
                    {activeConv.status === "closed" ? "Reopen" : "Close"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeConv.messages.map((msg) => {
                const isAgent = msg.senderType === "agent";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "group flex flex-col max-w-[78%]",
                      isAgent ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {msg.senderName}
                      </span>
                      {msg.isInternal && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                          <Lock className="h-2.5 w-2.5" />
                          Note
                        </span>
                      )}
                      <span className="font-mono">
                        <ShortTime date={msg.createdAt} />
                      </span>
                      <button
                        type="button"
                        onClick={() => setMessageToDelete(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive cursor-pointer rounded"
                        title="Delete message"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-2xs",
                        msg.isInternal
                          ? "border border-amber-500/30 bg-amber-500/10 text-foreground rounded-tr-sm"
                          : isAgent
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "border border-border bg-card text-foreground rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Composer */}
            <div className="border-t border-border bg-card p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsWhisper(false)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors",
                      !isWhisper
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWhisper(true)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors",
                      isWhisper
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Lock className="h-3 w-3" />
                    Internal Note
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-1.5">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setDraft(qr)}
                      className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground cursor-pointer"
                    >
                      {qr.slice(0, 26)}…
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSend} className="flex items-end gap-2">
                <Textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    isWhisper
                      ? "Add an internal note visible only to your team..."
                      : `Message ${activeCustomer.name}... (Press Enter to send)`
                  }
                  className={cn(
                    "min-h-[46px] max-h-32 resize-none",
                    isWhisper && "border-amber-500/40 bg-amber-500/[0.04]"
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim()}
                  className={cn(
                    "h-11 w-11 shrink-0",
                    isWhisper && "bg-amber-600 hover:bg-amber-700"
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center p-8">
            <EmptyState
              icon={<InboxIcon className="h-5 w-5" />}
              title="Select a conversation"
              description="Choose a customer thread from the left panel to start messaging."
            />
          </div>
        )}

        {/* Right Pane: Customer Context Sidebar (XL+) */}
        {activeCustomer && (
          <div className="hidden xl:flex w-72 flex-col border-l border-border bg-card p-4 space-y-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Customer Details
              </p>
              <Link
                href={`/customers/${activeCustomer.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                name={activeCustomer.name}
                color={activeCustomer.avatarColor}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {activeCustomer.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {activeCustomer.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PlanBadge plan={activeCustomer.plan} />
              <span className="font-mono text-xs text-muted-foreground">
                CSAT {activeCustomer.satisfactionScore.toFixed(1)}
              </span>
            </div>

            <Separator />

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground">{activeCustomer.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{activeCustomer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{activeCustomer.location}</span>
              </div>
            </div>

            {linkedTicket && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Linked Ticket
                  </p>
                  <Link
                    href={`/tickets/${linkedTicket.id}`}
                    className="block rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary">
                        <TicketIcon className="h-3 w-3" />
                        {linkedTicket.id}
                      </span>
                      <TicketStatusBadge status={linkedTicket.status} />
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-foreground line-clamp-2">
                      {linkedTicket.subject}
                    </p>
                  </Link>
                </div>
              </>
            )}

            {activeCustomer.notes && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Notes
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {activeCustomer.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Delete Message Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(messageToDelete)}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
        title="Delete message?"
        description="Are you sure you want to delete this message from the conversation thread? This cannot be undone."
        confirmLabel="Delete Message"
        destructive
        onConfirm={() => {
          if (activeConv && messageToDelete) {
            deleteInboxMessage(activeConv.id, messageToDelete);
            toast.success("Message deleted");
            setMessageToDelete(null);
          }
        }}
      />

      {/* Compose / New Conversation Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Customer Conversation</DialogTitle>
            <DialogDescription>
              Start an outbound support message or live chat thread with a customer.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!composeCustomer) {
                toast.error("Please select a customer");
                return;
              }
              if (!composeSubject.trim()) {
                toast.error("Please enter a subject");
                return;
              }
              if (!composeMessage.trim()) {
                toast.error("Please enter your message");
                return;
              }
              const created = createConversation({
                customerId: composeCustomer,
                subject: composeSubject.trim(),
                message: composeMessage.trim(),
                channel: composeChannel,
              });
              toast.success(`Created conversation: ${created.subject}`);
              setActiveId(created.id);
              setMobileShowChat(true);
              setComposeOpen(false);
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={composeCustomer}
                onValueChange={setComposeCustomer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select
                  value={composeChannel}
                  onValueChange={(v) => setComposeChannel(v as TicketChannel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">Live Chat</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="slack">Slack Connect</SelectItem>
                    <SelectItem value="web">Web Portal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Onboarding follow-up"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Initial Message</Label>
              <Textarea
                rows={3}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder="Hi Liam, following up on your integration status..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setComposeOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Start Conversation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
