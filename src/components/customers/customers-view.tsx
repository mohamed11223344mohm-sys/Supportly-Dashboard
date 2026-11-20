"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Building2,
  DollarSign,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlanBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/time-display";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { useSupportStore } from "@/store/use-support-store";
import { cn, formatCurrency } from "@/lib/utils";
import type { Customer, CustomerPlan } from "@/types";

export function CustomersView() {
  const customers = useSupportStore((s) => s.customers);
  const tickets = useSupportStore((s) => s.tickets);
  const addCustomer = useSupportStore((s) => s.addCustomer);
  const deleteCustomer = useSupportStore((s) => s.deleteCustomer);
  const compactDensity = useSupportStore((s) => s.settings.compactDensity);

  const [search, setSearch] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState<CustomerPlan | "all">("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(null);

  // New customer form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [plan, setPlan] = React.useState<CustomerPlan>("Business");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (planFilter !== "all" && c.plan !== planFilter) return false;
      if (q) {
        return [c.name, c.email, c.company, c.location, ...c.tags]
          .join(" ")
          .toLowerCase()
          .includes(q);
      }
      return true;
    });
  }, [customers, search, planFilter]);

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgCsat =
    customers.length > 0
      ? (
          customers.reduce((sum, c) => sum + c.satisfactionScore, 0) /
          customers.length
        ).toFixed(1)
      : "0.0";
  const enterpriseCount = customers.filter((c) => c.plan === "Enterprise").length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !company.trim()) {
      toast.error("Name, email, and company are required.");
      return;
    }
    const created = addCustomer({
      name,
      email,
      company,
      role,
      phone,
      location,
      plan,
    });
    toast.success(`Added customer ${created.name}`);
    setName("");
    setEmail("");
    setCompany("");
    setRole("");
    setPhone("");
    setLocation("");
    setPlan("Business");
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Track customer accounts, subscription tiers, ticket volume, and CSAT health."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Customer
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={customers.length}
          trend="+8.2%"
          subtext="Active workspaces"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Enterprise Accounts"
          value={enterpriseCount}
          subtext="Priority 2-hour SLA tier"
          icon={<Building2 className="h-4 w-4" />}
          iconBg="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Average CSAT"
          value={`${avgCsat} / 5.0`}
          trend="+0.2"
          subtext="Based on resolved tickets"
          icon={<Star className="h-4 w-4" />}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Total Account Value"
          value={formatCurrency(totalRevenue)}
          trend="+18.4%"
          subtext="Combined annual spend"
          icon={<DollarSign className="h-4 w-4" />}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <Card className="p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, company, email, or location..."
              className="pl-9"
            />
          </div>

          <Select
            value={planFilter}
            onValueChange={(v) => setPlanFilter(v as CustomerPlan | "all")}
          >
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
              <SelectItem value="Starter">Starter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No customers found"
          description="Try adjusting your search keywords or plan filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setPlanFilter("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/35">
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>CSAT</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => {
                const customerTickets = tickets.filter(
                  (t) => t.customerId === customer.id
                );
                const openCount = customerTickets.filter(
                  (t) => t.status === "open" || t.status === "in_progress"
                ).length;

                return (
                  <TableRow key={customer.id}>
                    <TableCell className={compactDensity ? "py-2 px-3" : "py-3.5 px-4"}>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <UserAvatar
                          name={customer.name}
                          color={customer.avatarColor}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                            {customer.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className={compactDensity ? "py-2 px-3" : "py-3.5 px-4"}>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {customer.company}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className={compactDensity ? "py-2 px-3" : "py-3.5 px-4"}>
                      <PlanBadge plan={customer.plan} />
                    </TableCell>
                    <TableCell className={compactDensity ? "py-2 px-3" : "py-3.5 px-4"}>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="font-semibold text-foreground">
                          {customerTickets.length}
                        </span>
                        {openCount > 0 && (
                          <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-600 dark:text-blue-400">
                            {openCount} active
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={compactDensity ? "py-2 px-3" : "py-3.5 px-4"}>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-medium">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {customer.satisfactionScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("font-mono text-xs font-medium", compactDensity ? "py-2 px-3" : "py-3.5 px-4")}>
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className={cn("font-mono text-xs text-muted-foreground", compactDensity ? "py-2 px-3" : "py-3.5 px-4")}>
                      <RelativeTime date={customer.lastActiveAt} />
                    </TableCell>
                    <TableCell className={cn("text-right", compactDensity ? "py-2 px-3" : "py-3.5 px-4")}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => setEditingCustomer(customer)}
                          title="Edit Customer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          onClick={() => setCustomerToDelete(customer)}
                          title="Delete Customer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                          <Link href={`/customers/${customer.id}`}>
                            Details
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Customer Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Create a new customer contact and associate them with a plan tier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Work Email</Label>
                <Input
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  placeholder="Acme Corp"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role / Title</Label>
                <Input
                  placeholder="Head of Engineering"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  placeholder="+1 (415) 555-0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  placeholder="London, UK"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subscription Plan</Label>
              <Select
                value={plan}
                onValueChange={(v) => setPlan(v as CustomerPlan)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EditCustomerDialog
        customer={editingCustomer}
        open={Boolean(editingCustomer)}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
      />

      <ConfirmDialog
        open={Boolean(customerToDelete)}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
        title={`Delete Customer ${customerToDelete?.name}?`}
        description="This will permanently delete this customer profile, their tickets, and all conversation records. This action cannot be undone."
        confirmLabel="Delete Customer"
        destructive
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            toast.success(`Customer ${customerToDelete.name} was removed`);
            setCustomerToDelete(null);
          }
        }}
      />
    </div>
  );
}
