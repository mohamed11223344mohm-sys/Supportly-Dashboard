"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Save,
  Star,
  Ticket as TicketIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChannelBadge,
  PlanBadge,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { FormattedDate, RelativeTime } from "@/components/shared/time-display";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { useSupportStore } from "@/store/use-support-store";
import { formatCurrency } from "@/lib/utils";

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const router = useRouter();
  const customers = useSupportStore((s) => s.customers);
  const tickets = useSupportStore((s) => s.tickets);
  const conversations = useSupportStore((s) => s.conversations);
  const updateCustomerNotes = useSupportStore((s) => s.updateCustomerNotes);
  const deleteCustomer = useSupportStore((s) => s.deleteCustomer);

  const customer = customers.find((c) => c.id === customerId);
  const [notes, setNotes] = React.useState(customer?.notes ?? "");
  const [newTicketOpen, setNewTicketOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (customer) setNotes(customer.notes ?? "");
  }, [customer]);

  if (!customer) {
    return (
      <EmptyState
        icon={<ArrowLeft className="h-5 w-5" />}
        title="Customer not found"
        description="This customer profile does not exist or has been removed."
        action={
          <Button asChild>
            <Link href="/customers">Back to Customers</Link>
          </Button>
        }
      />
    );
  }

  const customerTickets = tickets
    .filter((t) => t.customerId === customer.id)
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  const customerConversations = conversations.filter(
    (c) => c.customerId === customer.id
  );
  const openTickets = customerTickets.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;

  const handleSaveNotes = () => {
    updateCustomerNotes(customer.id, notes);
    toast.success("Customer notes saved");
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Customers
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{customer.name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="gap-1.5 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/inbox">
              <MessageSquare className="h-3.5 w-3.5" />
              Open Inbox
            </Link>
          </Button>
          <Button size="sm" onClick={() => setNewTicketOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Profile & Notes */}
        <div className="space-y-5 lg:col-span-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  name={customer.name}
                  color={customer.avatarColor}
                  size="lg"
                />
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold text-foreground">
                    {customer.name}
                  </h1>
                  <p className="truncate text-xs text-muted-foreground">
                    {customer.role} at {customer.company}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <PlanBadge plan={customer.plan} />
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {customer.satisfactionScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground font-medium">{customer.company}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {customer.location} · {customer.timezone}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Customer since <FormattedDate date={customer.createdAt} dateOnly />
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Last active <RelativeTime date={customer.lastActiveAt} />
                  </span>
                </div>
              </div>

              {customer.tags.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Account Notes</CardTitle>
              <CardDescription>
                Private context shared across support agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add SLA details, technical stack, or VIP handling notes..."
              />
              <Button size="sm" variant="outline" onClick={handleSaveNotes}>
                <Save className="h-3.5 w-3.5" />
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: KPIs + Tickets & Interactions */}
        <div className="space-y-5 lg:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total Tickets</p>
              <p className="mt-1 font-mono text-2xl font-semibold">
                {customerTickets.length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {openTickets} currently active
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Annual Spend</p>
              <p className="mt-1 flex items-center gap-1 font-mono text-2xl font-semibold">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                {formatCurrency(customer.totalSpent).replace("$", "")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {customer.plan} tier
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Conversations</p>
              <p className="mt-1 font-mono text-2xl font-semibold">
                {customerConversations.length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Across chat & email
              </p>
            </Card>
          </div>

          <Tabs defaultValue="tickets">
            <TabsList>
              <TabsTrigger value="tickets">
                <TicketIcon className="h-3.5 w-3.5" />
                Tickets ({customerTickets.length})
              </TabsTrigger>
              <TabsTrigger value="interactions">
                <MessageSquare className="h-3.5 w-3.5" />
                Conversations ({customerConversations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tickets">
              {customerTickets.length === 0 ? (
                <EmptyState
                  icon={<TicketIcon className="h-5 w-5" />}
                  title="No tickets yet"
                  description="This customer hasn't submitted any support tickets yet."
                  action={
                    <Button size="sm" onClick={() => setNewTicketOpen(true)}>
                      Create first ticket
                    </Button>
                  }
                />
              ) : (
                <Card className="divide-y divide-border/70">
                  {customerTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {ticket.id}
                          </span>
                          <ChannelBadge channel={ticket.channel} />
                          <span className="text-xs text-muted-foreground">
                            {ticket.category}
                          </span>
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated <RelativeTime date={ticket.updatedAt} /> ·{" "}
                          {ticket.messages.length} messages
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <TicketPriorityBadge priority={ticket.priority} />
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                    </Link>
                  ))}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="interactions">
              {customerConversations.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-5 w-5" />}
                  title="No inbox threads"
                  description="No live chat or email inbox conversations recorded for this customer."
                />
              ) : (
                <div className="space-y-3">
                  {customerConversations.map((conv) => (
                    <Card key={conv.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{conv.subject}</h3>
                          <ChannelBadge channel={conv.channel} />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          <RelativeTime date={conv.lastMessageAt} />
                        </span>
                      </div>
                      <div className="space-y-2 border-l-2 border-border pl-3">
                        {conv.messages.map((m) => (
                          <div key={m.id} className="text-xs">
                            <span className="font-semibold text-foreground">
                              {m.senderName}:{" "}
                            </span>
                            <span className="text-muted-foreground">{m.content}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <TicketModal
        open={newTicketOpen}
        onOpenChange={setNewTicketOpen}
        defaultCustomerId={customer.id}
      />

      <EditCustomerDialog
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete Customer ${customer.name}?`}
        description="This will permanently delete this customer profile, their tickets, and all conversation records. This action cannot be undone."
        confirmLabel="Delete Customer"
        destructive
        onConfirm={() => {
          deleteCustomer(customer.id);
          toast.success(`Customer ${customer.name} was removed`);
          router.push("/customers");
        }}
      />
    </div>
  );
}
