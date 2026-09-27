"use client";

import { useQuery } from "@tanstack/react-query";
import { AvailabilityForm } from "@/components/public/availability-form";
import { ScheduleLookup } from "@/components/public/schedule-lookup";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { fetchPublicShift, publicShiftQueryKey } from "@/lib/public-shift";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "We couldn't open this link. Try again.";
}

export function PublicShiftPage({ linkToken }: { linkToken: string }) {
  const link = useQuery({
    queryKey: publicShiftQueryKey(linkToken),
    queryFn: () => fetchPublicShift(linkToken),
    retry: false,
  });

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 py-10">
      {link.isPending ? (
        <p className="text-sm text-muted-foreground">Opening this link…</p>
      ) : null}

      {link.isError ? (
        <div className="space-y-4 py-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            This link isn't available
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {errorMessage(link.error)}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              void link.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {link.data &&
      (link.data.status === "DRAFT" || link.data.status === "COLLECTING") ? (
        <AvailabilityForm
          linkToken={linkToken}
          status={link.data.status}
          restaurantName={link.data.restaurantName}
          branchName={link.data.branchName}
          cycleLabel={link.data.cycleLabel}
        />
      ) : null}

      {link.data &&
      (link.data.status === "GENERATED" || link.data.status === "CONFIRMED") ? (
        <ScheduleLookup
          linkToken={linkToken}
          restaurantName={link.data.restaurantName}
          branchName={link.data.branchName}
          cycleLabel={link.data.cycleLabel}
        />
      ) : null}
    </main>
  );
}
