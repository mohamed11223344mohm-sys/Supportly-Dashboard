"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, DollarSign, Star, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PlanBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSupportStore } from "@/store/use-support-store";
import { cn, formatCurrency } from "@/lib/utils";
import type { Customer, CustomerPlan } from "@/types";

const AVATAR_COLORS = [
  { label: "Indigo", value: "bg-indigo-500" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Violet", value: "bg-violet-500" },
  { label: "Sky", value: "bg-sky-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Rose", value: "bg-rose-500" },
  { label: "Teal", value: "bg-teal-500" },
];

export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
  onSaved,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (customer: Customer) => void;
}) {
  const updateCustomer = useSupportStore((s) => s.updateCustomer);
  const deleteCustomer = useSupportStore((s) => s.deleteCustomer);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [role, setRole] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [plan, setPlan] = React.useState<CustomerPlan>("Enterprise");
  const [totalSpent, setTotalSpent] = React.useState<number>(48600);
  const [notes, setNotes] = React.useState("");
  const [avatarColor, setAvatarColor] = React.useState("bg-indigo-500");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone || "");
    setCompany(customer.company);
    setRole(customer.role || "Customer");
    setLocation(customer.location || "Remote");
    setPlan(customer.plan);
    setTotalSpent(customer.totalSpent ?? 0);
    setNotes(customer.notes || "");
    setAvatarColor(customer.avatarColor || "bg-indigo-500");
  }, [customer, open]);

  if (!customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a customer name");
      return;
    }
    if (!company.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    const patch: Partial<Customer> = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      role: role.trim(),
      location: location.trim(),
      plan,
      totalSpent: Math.max(0, Number(totalSpent) || 0),
      notes: notes.trim(),
      avatarColor,
    };

    updateCustomer(customer.id, patch);
    toast.success(`Updated customer ${name.trim()} successfully!`);
    onSaved?.({ ...customer, ...patch });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto pr-2">
          <DialogHeader>
            <DialogTitle>Edit Customer Account</DialogTitle>
            <DialogDescription>
              Update contact info, subscription plan, annual account spend, and notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Header Live Preview & Avatar Color */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  name={name || customer.name}
                  color={avatarColor}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{name || customer.name}</p>
                    <PlanBadge plan={plan} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {role || customer.role} at {company || customer.company}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                    Annual Spend: {formatCurrency(Number(totalSpent) || 0)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Avatar Color
                </Label>
                <div className="flex items-center gap-1.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAvatarColor(c.value)}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full transition-all cursor-pointer",
                        c.value,
                        avatarColor === c.value
                          ? "ring-2 ring-primary ring-offset-2 scale-110"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      )}
                      title={c.label}
                    >
                      {avatarColor === c.value && (
                        <Check className="h-2.5 w-2.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name">Full Name</Label>
                <Input
                  id="cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Liam Holloway"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-email">Work Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="liam@vervecloud.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-company">Company</Label>
                <Input
                  id="cust-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="VerveCloud Systems"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-role">Job Title / Role</Label>
                <Input
                  id="cust-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="VP of Engineering"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Phone</Label>
                <Input
                  id="cust-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (415) 890-3321"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-location">Location</Label>
                <Input
                  id="cust-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, US"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Subscription Plan Tier</Label>
                <Select
                  value={plan}
                  onValueChange={(v) => {
                    const nextPlan = v as CustomerPlan;
                    setPlan(nextPlan);
                    // Propose default spend if currently standard
                    if (totalSpent === 48600 || totalSpent === 36400 || totalSpent === 14200 || totalSpent === 4800) {
                      setTotalSpent(
                        nextPlan === "Enterprise"
                          ? 48600
                          : nextPlan === "Business"
                          ? 24000
                          : nextPlan === "Growth"
                          ? 9600
                          : 3600
                      );
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enterprise">Enterprise (Priority SLA)</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                    <SelectItem value="Starter">Starter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-spend">Annual Account Spend ($)</Label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="cust-spend"
                    type="number"
                    min={0}
                    step={100}
                    value={totalSpent}
                    onChange={(e) => setTotalSpent(Number(e.target.value) || 0)}
                    className="pl-8 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-notes">Account Notes (Internal Team Context)</Label>
              <Textarea
                id="cust-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key enterprise account on annual SLA with 2-hour response guarantee. Uses Okta SAML SSO."
              />
            </div>

            <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Customer
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete Customer ${customer.name}?`}
        description="This will permanently delete this customer profile, their tickets, and conversation history. This action cannot be undone."
        confirmLabel="Delete Customer"
        destructive
        onConfirm={() => {
          deleteCustomer(customer.id);
          toast.success(`Customer ${customer.name} was removed`);
          onOpenChange(false);
        }}
      />
    </>
  );
}
