import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
        404 · Not Found
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The ticket, customer, or workspace view you requested may have been moved or removed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
