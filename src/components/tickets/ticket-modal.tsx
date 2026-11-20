"use client";

import * as React from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupportStore } from "@/store/use-support-store";
import type {
  Ticket,
  TicketCategory,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from "@/types";

const CATEGORIES: TicketCategory[] = [
  "Technical",
  "Billing",
  "Account",
  "Integrations",
  "Bug Report",
  "Feature Request",
];

const CHANNELS: { value: TicketChannel; label: string }[] = [
  { value: "web", label: "Web Portal" },
  { value: "email", label: "Email" },
  { value: "chat", label: "Live Chat" },
  { value: "slack", label: "Slack Connect" },
  { value: "phone", label: "Phone" },
];

export function TicketModal({
  open,
  onOpenChange,
  ticket,
  defaultCustomerId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket | null;
  defaultCustomerId?: string;
  onCreated?: (ticket: Ticket) => void;
}) {
  const customers = useSupportStore((s) => s.customers);
  const agents = useSupportStore((s) => s.agents);
  const createTicket = useSupportStore((s) => s.createTicket);
  const updateTicket = useSupportStore((s) => s.updateTicket);

  const isEdit = Boolean(ticket);

  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [customerId, setCustomerId] = React.useState(defaultCustomerId ?? customers[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = React.useState<string>("unassigned");
  const [priority, setPriority] = React.useState<TicketPriority>("medium");
  const [status, setStatus] = React.useState<TicketStatus>("open");
  const [category, setCategory] = React.useState<TicketCategory>("Technical");
  const [channel, setChannel] = React.useState<TicketChannel>("web");
  const [tagsInput, setTagsInput] = React.useState("");
  const [slaHours, setSlaHours] = React.useState<number>(8);

  React.useEffect(() => {
    if (!open) return;
    if (ticket) {
      setSubject(ticket.subject);
      setDescription(ticket.description);
      setCustomerId(ticket.customerId);
      setAssigneeId(ticket.assigneeId ?? "unassigned");
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setCategory(ticket.category);
      setChannel(ticket.channel);
      setTagsInput(ticket.tags.join(", "));
      if (ticket.slaDueAt) {
        const remainingHours = Math.max(
          1,
          Math.round((new Date(ticket.slaDueAt).getTime() - Date.now()) / 3_600_000)
        );
        setSlaHours(remainingHours <= 72 ? remainingHours : 8);
      } else {
        setSlaHours(
          ticket.priority === "urgent"
            ? 1
            : ticket.priority === "high"
            ? 4
            : ticket.priority === "medium"
            ? 8
            : 24
        );
      }
    } else {
      setSubject("");
      setDescription("");
      setCustomerId(defaultCustomerId ?? customers[0]?.id ?? "");
      setAssigneeId("unassigned");
      setPriority("medium");
      setStatus("open");
      setCategory("Technical");
      setChannel("web");
      setTagsInput("");
      setSlaHours(8);
    }
  }, [open, ticket, defaultCustomerId, customers]);

  const handlePriorityChange = (val: TicketPriority) => {
    setPriority(val);
    if (val === "urgent") setSlaHours(1);
    else if (val === "high") setSlaHours(4);
    else if (val === "medium") setSlaHours(8);
    else if (val === "low") setSlaHours(24);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("Please enter a ticket subject.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a brief description of the issue.");
      return;
    }

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const normalizedAssignee = assigneeId === "unassigned" ? null : assigneeId;

    if (ticket) {
      updateTicket(ticket.id, {
        subject: subject.trim(),
        description: description.trim(),
        status,
        priority,
        category,
        channel,
        customerId,
        assigneeId: normalizedAssignee,
        tags: parsedTags,
        slaHours,
      });
      toast.success(`Ticket ${ticket.id} updated`);
      onOpenChange(false);
    } else {
      const created = createTicket({
        subject,
        description,
        customerId: customerId || customers[0]?.id || "cust-1",
        assigneeId: normalizedAssignee,
        priority,
        status,
        category,
        channel,
        tags: parsedTags.length > 0 ? parsedTags : [category.toLowerCase()],
        slaHours,
      });
      toast.success(`Created ticket ${created.id}`, {
        description: created.subject,
      });
      onCreated?.(created);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit Ticket ${ticket?.id}` : "Create New Support Ticket"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update ticket metadata, priority, status, or assigned agent."
              : "Log a new customer request and route it to your support team."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              placeholder="e.g., SAML SSO login failing after certificate update"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc">Description</Label>
            <Textarea
              id="ticket-desc"
              rows={3}
              placeholder="Describe the customer's issue, error codes, and impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={customerId}
                onValueChange={setCustomerId}
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

            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned (Queue)</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => handlePriorityChange(v as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TicketStatus)}
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
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TicketCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as TicketChannel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((ch) => (
                    <SelectItem key={ch.value} value={ch.value}>
                      {ch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>SLA Target Duration</Label>
              <Select
                value={String(slaHours)}
                onValueChange={(v) => setSlaHours(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SLA Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour · Urgent / Critical</SelectItem>
                  <SelectItem value="2">2 Hours · Fast Track SLA</SelectItem>
                  <SelectItem value="4">4 Hours · High Priority</SelectItem>
                  <SelectItem value="8">8 Hours · Standard Business</SelectItem>
                  <SelectItem value="12">12 Hours · Extended Day</SelectItem>
                  <SelectItem value="24">24 Hours · Next Business Day</SelectItem>
                  <SelectItem value="48">48 Hours · Flexible SLA</SelectItem>
                  <SelectItem value="72">72 Hours · Low Priority Backlog</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>SLA Target Deadline</Label>
              <div className="flex h-10 items-center justify-between rounded-md border border-input bg-muted/30 px-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Due in {slaHours}h
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {new Date(Date.now() + slaHours * 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-tags">Tags (comma separated)</Label>
            <Input
              id="ticket-tags"
              placeholder="sso, billing, enterprise"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Save Changes" : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
