"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSupportStore } from "@/store/use-support-store";
import { SidebarContent } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sidebarCollapsed = useSupportStore((s) => s.sidebarCollapsed);
  const compactDensity = useSupportStore((s) => s.settings.compactDensity);
  const toggleSidebar = useSupportStore((s) => s.toggleSidebar);

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [newTicketOpen, setNewTicketOpen] = React.useState(false);

  React.useEffect(() => {
    void useSupportStore.persist.rehydrate();
  }, []);

  return (
    <div
      className="flex min-h-screen bg-background"
      data-density={compactDensity ? "compact" : "comfortable"}
    >
      {/* Desktop Fixed Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-all duration-200 lg:block",
          sidebarCollapsed ? "w-[68px]" : "w-[248px]"
        )}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          showCollapseToggle
        />
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-all duration-200 min-w-0",
          sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-[248px]"
        )}
      >
        <TopNavbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenNewTicket={() => setNewTicketOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Global Command Palette & Quick New Ticket Modal */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <TicketModal
        open={newTicketOpen}
        onOpenChange={setNewTicketOpen}
        onCreated={(created) => router.push(`/tickets/${created.id}`)}
      />
    </div>
  );
}
