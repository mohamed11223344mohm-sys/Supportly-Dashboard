import * as React from "react";
import type { Metadata } from "next";
import { TicketsView } from "@/components/tickets/tickets-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Tickets",
};

export default function TicketsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      }
    >
      <TicketsView />
    </React.Suspense>
  );
}
