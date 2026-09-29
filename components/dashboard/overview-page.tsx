"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Store } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ShiftStatusBadge } from "@/components/dashboard/shift-status-badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  fetchOverview,
  overviewQueryKey,
} from "@/lib/dashboard";

export function OverviewPage() {
  const overview = useQuery({
    queryKey: overviewQueryKey,
    queryFn: fetchOverview,
    retry: false,
  });

  if (overview.isPending) {
    return (
      <p className="text-sm text-muted-foreground">Loading your restaurant…</p>
    );
  }

  if (overview.isError) {
    const message =
      overview.error instanceof ApiError
        ? overview.error.message
        : "We couldn't load the overview. Try again.";

    return (
      <div className="max-w-md space-y-3">
        <p className="text-sm text-destructive">{message}</p>
        <Button
          variant="outline"
          onClick={() => {
            void overview.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const data = overview.data;

  if (data.branchCount === 0) {
    return (
      <div className="flex w-full flex-col gap-6">
        <PageIntro description="Start with one location. Schedules are built for a branch." />
        <EmptyState
          title="Add your first branch"
          description="A branch is one location. Add it, then you can collect availability and build a schedule for that team."
          action={
            <Button asChild>
              <Link href="/manager/branches">
                <Store />
                Add your first branch
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <PageIntro description="Branches, open schedules, and anything still short on people." />
      {data.underfilled.length > 0 ? (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-5">
          <h2 className="text-base font-semibold text-destructive">
            A schedule is still short on people
          </h2>
          <ul className="mt-3 divide-y divide-destructive/15">
            {data.underfilled.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/manager/shift-requirements/${item.id}`}
                  className="block py-3"
                >
                  <span className="text-base font-medium">
                    {item.branchName} · {item.cycleLabel}
                  </span>
                  <span className="mt-1 block text-sm text-destructive">
                    {item.missingPeople === 1
                      ? "1 person still needed"
                      : `${item.missingPeople} people still needed`}
                    {" across "}
                    {item.shortSlots === 1
                      ? "1 shift"
                      : `${item.shortSlots} shifts`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/manager/branches"
          className="rounded-xl border border-border px-5 py-5 transition-colors hover:bg-muted"
        >
          <p className="text-sm text-muted-foreground">Branches</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {data.branchCount}
          </p>
        </Link>
        <Link
          href="/manager/shift-requirements"
          className="rounded-xl border border-border px-5 py-5 transition-colors hover:bg-muted"
        >
          <p className="text-sm text-muted-foreground">Active schedules</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {data.activeShiftRequirementCount}
          </p>
        </Link>
        {data.latestActive ? (
          <Link
            href={`/manager/shift-requirements/${data.latestActive.id}`}
            className="rounded-xl border border-border px-5 py-5 transition-colors hover:bg-muted"
          >
            <p className="text-sm text-muted-foreground">Latest schedule</p>
            <p className="mt-3 text-base font-medium tracking-tight">
              {data.latestActive.cycleLabel}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.latestActive.branchName}
              {" · "}
              {data.latestActive.submissionCount === 1
                ? "1 submission"
                : `${data.latestActive.submissionCount} submissions`}
            </p>
            <div className="mt-3">
              <ShiftStatusBadge status={data.latestActive.status} />
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-border px-5 py-5">
            <p className="text-sm text-muted-foreground">Latest schedule</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              No schedule yet.
            </p>
          </div>
        )}
      </div>

      {data.latestActive ? null : (
        <EmptyState
          title="Create the first schedule"
          description="Set how many people you need, then send one link to the team."
          action={
            <Button asChild>
              <Link href="/manager/shift-requirements">
                <Plus />
                Create a shift requirement
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
