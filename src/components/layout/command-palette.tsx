"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Inbox,
  LayoutDashboard,
  Search,
  Settings,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSupportStore } from "@/store/use-support-store";
import { TicketStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";

const QUICK_PAGES = [
  { label: "Dashboard Overview", href: "/", icon: LayoutDashboard },
  { label: "Tickets Management", href: "/tickets", icon: Ticket },
  { label: "Live Inbox", href: "/inbox", icon: Inbox },
  { label: "Customers Directory", href: "/customers", icon: Users },
  { label: "Team Management", href: "/team", icon: UserCog },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  { label: "Workspace Settings", href: "/settings", icon: Settings },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const tickets = useSupportStore((s) => s.tickets);
  const customers = useSupportStore((s) => s.customers);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();

  const matchingTickets = React.useMemo(() => {
    if (!q) return tickets.slice(0, 4);
    return tickets
      .filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [tickets, q]);

  const matchingCustomers = React.useMemo(() => {
    if (!q) return customers.slice(0, 3);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [customers, q]);

  const matchingPages = React.useMemo(() => {
    if (!q) return QUICK_PAGES.slice(0, 4);
    return QUICK_PAGES.filter((p) => p.label.toLowerCase().includes(q));
  }, [q]);

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0 [&>button]:top-3.5 [&>button]:right-3.5">
        <DialogTitle className="sr-only">Quick Search</DialogTitle>
        <div className="flex items-center border-b border-border px-4">
          <Search className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets, customers, or jump to a page..."
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {matchingTickets.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tickets
              </p>
              <div className="space-y-0.5">
                {matchingTickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-medium text-primary shrink-0">
                        {t.id}
                      </span>
                      <span className="truncate text-foreground">{t.subject}</span>
                    </div>
                    <TicketStatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingCustomers.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Customers
              </p>
              <div className="space-y-0.5">
                {matchingCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={c.name} color={c.avatarColor} size="xs" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.company} · {c.email}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingPages.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </p>
              <div className="space-y-0.5">
                {matchingPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.href}
                      type="button"
                      onClick={() => navigate(page.href)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{page.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {matchingTickets.length === 0 &&
            matchingCustomers.length === 0 &&
            matchingPages.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
