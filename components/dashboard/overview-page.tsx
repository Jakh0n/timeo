"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import {
  fetchOverview,
  overviewQueryKey,
  SHIFT_STATUS_LABEL,
  type ShiftStatus,
} from "@/lib/dashboard";

function statusLabel(status: ShiftStatus): string {
  return SHIFT_STATUS_LABEL[status];
}

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
      <div className="flex max-w-md flex-col items-start gap-4 py-10">
        <h2 className="text-xl font-semibold tracking-tight">
          Add your first branch
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          A branch is one location. Add it, then you can collect availability
          and build a schedule for that team.
        </p>
        <Button asChild>
          <Link href="/manager/branches">Add your first branch</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-10">
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

      <dl className="grid gap-8 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Branches</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight">
            {data.branchCount}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Active schedules</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight">
            {data.activeShiftRequirementCount}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Latest schedule</dt>
          <dd className="mt-1">
            {data.latestActive ? (
              <div className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight">
                  {data.latestActive.submissionCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.latestActive.submissionCount === 1
                    ? "submission"
                    : "submissions"}
                </p>
                <Badge
                  variant={
                    data.latestActive.status === "CONFIRMED"
                      ? "success"
                      : "outline"
                  }
                >
                  {statusLabel(data.latestActive.status)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {data.latestActive.branchName} · {data.latestActive.cycleLabel}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active schedule yet.
              </p>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
