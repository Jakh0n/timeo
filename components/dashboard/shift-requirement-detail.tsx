"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ShiftStatusBadge } from "@/components/dashboard/shift-status-badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { overviewQueryKey } from "@/lib/dashboard";
import {
  fetchShiftRequirement,
  shiftRequirementQueryKey,
  shiftRequirementsQueryKey,
  startCollecting,
} from "@/lib/shift-requirements";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

function formatCreatedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const STAFFING_ROWS = [
  { key: "weekdayDayRequired", label: "Weekday day shift" },
  { key: "weekdayNightRequired", label: "Weekday night shift" },
  { key: "weekendDayRequired", label: "Weekend day shift" },
  { key: "weekendNightRequired", label: "Weekend night shift" },
] as const;

export function ShiftRequirementDetail({
  requirementId,
}: {
  requirementId: string;
}) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const requirement = useQuery({
    queryKey: shiftRequirementQueryKey(requirementId),
    queryFn: () => fetchShiftRequirement(requirementId),
    retry: false,
  });

  const collect = useMutation({
    mutationFn: () => startCollecting(requirementId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(shiftRequirementQueryKey(requirementId), updated);
      await queryClient.invalidateQueries({ queryKey: shiftRequirementsQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
    },
  });

  if (requirement.isPending) {
    return (
      <p className="text-sm text-muted-foreground">Loading this schedule…</p>
    );
  }

  if (requirement.isError) {
    return (
      <div className="max-w-md space-y-3">
        <p className="text-sm text-destructive">{errorMessage(requirement.error)}</p>
        <Button
          variant="outline"
          onClick={() => {
            void requirement.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const data = requirement.data;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="space-y-2">
        <Link
          href="/manager/shift-requirements"
          className="text-sm text-primary"
        >
          All shift requirements
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {data.cycleLabel}
          </h2>
          <ShiftStatusBadge status={data.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {data.branchName} · {data.submissionCount}{" "}
          {data.submissionCount === 1 ? "submission" : "submissions"} ·{" "}
          {formatCreatedDate(data.createdAt)}
        </p>
      </div>

      <section className="rounded-xl border border-border px-5 py-5">
        <h3 className="text-base font-medium">Shareable link</h3>
        <p className="mt-3 break-all text-sm">{data.shareUrl}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCopyError(null);
              void navigator.clipboard.writeText(data.shareUrl).then(
                () => {
                  setCopied(true);
                },
                () => {
                  setCopied(false);
                  setCopyError("Select the link and copy it yourself.");
                },
              );
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
          {data.status === "DRAFT" ? (
            <Button
              type="button"
              disabled={collect.isPending}
              onClick={() => {
                collect.mutate();
              }}
            >
              {collect.isPending ? "Starting…" : "Start collecting"}
            </Button>
          ) : null}
        </div>
        {data.status === "DRAFT" ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Workers can open this link now. Start collecting when you want it marked as open.
          </p>
        ) : null}
        {data.status === "COLLECTING" ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Share this link so the team can send availability.
          </p>
        ) : null}
        {copyError ? (
          <p className="mt-3 text-sm text-destructive">{copyError}</p>
        ) : null}
        {collect.error ? (
          <p className="mt-3 text-sm text-destructive">
            {errorMessage(collect.error)}
          </p>
        ) : null}
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        {STAFFING_ROWS.map((row) => (
          <div key={row.key}>
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="mt-1 text-sm font-medium">{data[row.key]}</dd>
          </div>
        ))}
        <div>
          <dt className="text-sm text-muted-foreground">Minimum seniors</dt>
          <dd className="mt-1 text-sm font-medium">
            {data.requiredSeniorPerShift}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Maximum seniors</dt>
          <dd className="mt-1 text-sm font-medium">{data.maxSeniorPerShift}</dd>
        </div>
      </dl>
    </div>
  );
}
