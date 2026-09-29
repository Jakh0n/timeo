"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, Copy, Pencil, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScheduleBoard } from "@/components/dashboard/schedule-board";
import { ShiftRequirementEditDialog } from "@/components/dashboard/shift-requirement-edit-dialog";
import { ShiftStatusBadge } from "@/components/dashboard/shift-status-badge";
import { SubmissionList } from "@/components/dashboard/submission-list";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { overviewQueryKey, type ShiftStatus } from "@/lib/dashboard";
import {
  confirmSchedule,
  fetchSchedule,
  fetchShiftRequirement,
  generateSchedule,
  reopenSchedule,
  scheduleQueryKey,
  shiftRequirementQueryKey,
  shiftRequirementsQueryKey,
  startCollecting,
  type ShiftRequirementDetail as ShiftRequirementDetailData,
} from "@/lib/shift-requirements";

const STEPS: { status: ShiftStatus; label: string }[] = [
  { status: "DRAFT", label: "Setup" },
  { status: "COLLECTING", label: "Collecting" },
  { status: "GENERATED", label: "Review" },
  { status: "CONFIRMED", label: "Confirmed" },
];

const STAFFING_ROWS = [
  { key: "weekdayDayRequired", label: "Weekday day shift" },
  { key: "weekdayNightRequired", label: "Weekday night shift" },
  { key: "weekendDayRequired", label: "Weekend day shift" },
  { key: "weekendNightRequired", label: "Weekend night shift" },
] as const;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

function stepIndex(status: ShiftStatus): number {
  return STEPS.findIndex((step) => step.status === status);
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

function ScheduleStepper({
  status,
  viewed,
  onView,
}: {
  status: ShiftStatus;
  viewed: ShiftStatus;
  onView: (status: ShiftStatus) => void;
}) {
  const current = stepIndex(status);

  return (
    <nav aria-label="Schedule progress" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STEPS.map((step, index) => {
        const reached = index <= current;
        const selected = step.status === viewed;
        const currentStep = step.status === status;

        return (
          <button
            key={step.status}
            type="button"
            disabled={!reached}
            aria-current={currentStep ? "step" : undefined}
            onClick={() => {
              onView(step.status);
            }}
            className={
              selected
                ? "rounded-lg border border-primary bg-background px-3 py-2 text-left text-sm font-medium text-foreground"
                : currentStep
                  ? "rounded-lg border border-foreground/30 px-3 py-2 text-left text-sm font-medium text-foreground"
                  : reached
                    ? "rounded-lg border border-border px-3 py-2 text-left text-sm text-muted-foreground"
                    : "rounded-lg border border-border px-3 py-2 text-left text-sm text-muted-foreground opacity-50"
            }
          >
            <span className="block text-xs text-muted-foreground">{index + 1}</span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}

function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  return (
    <section className="rounded-xl border border-border px-5 py-5">
      <h3 className="text-base font-medium">Shareable link</h3>
      <p className="mt-3 break-all text-sm">{url}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={() => {
          setCopyError(null);
          void navigator.clipboard.writeText(url).then(
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
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      {copyError ? <p className="mt-3 text-sm text-destructive">{copyError}</p> : null}
    </section>
  );
}

function StaffingSummary({
  requirement,
  canEdit,
  onEdit,
}: {
  requirement: ShiftRequirementDetailData;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">Staffing</h3>
        {canEdit ? (
          <Button type="button" variant="outline" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        ) : null}
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {STAFFING_ROWS.map((row) => (
          <div key={row.key}>
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="mt-1 text-sm font-medium">{requirement[row.key]}</dd>
          </div>
        ))}
        <div>
          <dt className="text-sm text-muted-foreground">Minimum seniors</dt>
          <dd className="mt-1 text-sm font-medium">{requirement.requiredSeniorPerShift}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Maximum seniors</dt>
          <dd className="mt-1 text-sm font-medium">{requirement.maxSeniorPerShift}</dd>
        </div>
      </dl>
    </section>
  );
}

function ScheduleStage({
  requirementId,
  editable,
}: {
  requirementId: string;
  editable: boolean;
}) {
  const schedule = useQuery({
    queryKey: scheduleQueryKey(requirementId),
    queryFn: () => fetchSchedule(requirementId),
    retry: false,
  });

  if (schedule.isPending) {
    return <p className="text-sm text-muted-foreground">Loading the schedule…</p>;
  }

  if (schedule.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{errorMessage(schedule.error)}</p>
        <Button
          variant="outline"
          onClick={() => {
            void schedule.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ScheduleBoard
      requirementId={requirementId}
      slots={schedule.data}
      editable={editable}
    />
  );
}

export function ShiftRequirementDetail({
  requirementId,
}: {
  requirementId: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [viewed, setViewed] = useState<ShiftStatus | null>(null);
  const [trackedStatus, setTrackedStatus] = useState<ShiftStatus | null>(null);
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

  const generate = useMutation({
    mutationFn: () => generateSchedule(requirementId),
    onSuccess: async () => {
      queryClient.setQueryData(
        shiftRequirementQueryKey(requirementId),
        (current: ShiftRequirementDetailData | undefined) =>
          current ? { ...current, status: "GENERATED" as const } : current,
      );
      await queryClient.invalidateQueries({
        queryKey: shiftRequirementQueryKey(requirementId),
      });
      await queryClient.invalidateQueries({ queryKey: scheduleQueryKey(requirementId) });
      await queryClient.invalidateQueries({ queryKey: shiftRequirementsQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
    },
  });

  const confirm = useMutation({
    mutationFn: () => confirmSchedule(requirementId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(shiftRequirementQueryKey(requirementId), updated);
      await queryClient.invalidateQueries({ queryKey: scheduleQueryKey(requirementId) });
      await queryClient.invalidateQueries({ queryKey: shiftRequirementsQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
    },
  });

  const reopen = useMutation({
    mutationFn: () => reopenSchedule(requirementId),
    onSuccess: async (updated) => {
      queryClient.setQueryData(shiftRequirementQueryKey(requirementId), updated);
      await queryClient.invalidateQueries({ queryKey: scheduleQueryKey(requirementId) });
      await queryClient.invalidateQueries({ queryKey: shiftRequirementsQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
    },
  });

  if (requirement.isPending) {
    return <p className="text-sm text-muted-foreground">Loading this schedule…</p>;
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

  if (data.status !== trackedStatus) {
    setTrackedStatus(data.status);
    setViewed(null);
  }

  const stage = viewed ?? data.status;
  const stageIsCurrent = stage === data.status;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-2">
        <Link href="/manager/shift-requirements" className="text-sm text-primary">
          All shift requirements
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{data.cycleLabel}</h2>
          <ShiftStatusBadge status={data.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {data.branchName} · {data.submissionCount}{" "}
          {data.submissionCount === 1 ? "submission" : "submissions"} ·{" "}
          {formatCreatedDate(data.createdAt)}
        </p>
      </div>

      <ScheduleStepper status={data.status} viewed={stage} onView={setViewed} />

      {stage === "DRAFT" || stage === "COLLECTING" ? <ShareLink url={data.shareUrl} /> : null}

      {stage === "DRAFT" ? (
        <div className="space-y-6">
          <StaffingSummary
            requirement={data}
            canEdit={stageIsCurrent}
            onEdit={() => {
              setEditing(true);
            }}
          />
          {stageIsCurrent ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Workers can open the link now. Start collecting when you want this marked as open.
              </p>
              <Button
                type="button"
                disabled={collect.isPending}
                onClick={() => {
                  collect.mutate();
                }}
              >
                <Send />
                {collect.isPending ? "Starting…" : "Start collecting availability"}
              </Button>
              {collect.error ? (
                <p className="text-sm text-destructive">{errorMessage(collect.error)}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Collecting has already started. Use the steps above to get back to the current stage.
            </p>
          )}
        </div>
      ) : null}

      {stage === "COLLECTING" ? (
        <div className="space-y-6">
          <SubmissionList requirementId={requirementId} live={data.status === "COLLECTING"} />
          {stageIsCurrent ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Generate whenever you decide there are enough responses. There is no minimum count.
              </p>
              <Button
                type="button"
                disabled={generate.isPending}
                onClick={() => {
                  generate.mutate();
                }}
              >
                <CalendarClock />
                {generate.isPending ? "Generating…" : "Generate schedule"}
              </Button>
              {generate.error ? (
                <p className="text-sm text-destructive">{errorMessage(generate.error)}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {stage === "GENERATED" ? (
        <div className="space-y-6">
          <ScheduleStage requirementId={requirementId} editable={stageIsCurrent} />
          {stageIsCurrent ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Workers only see their shifts after you confirm. You can confirm even if some shifts are still short.
              </p>
              <Button
                type="button"
                disabled={confirm.isPending}
                onClick={() => {
                  confirm.mutate();
                }}
              >
                <Check />
                {confirm.isPending ? "Confirming…" : "Confirm and finalize"}
              </Button>
              {confirm.error ? (
                <p className="text-sm text-destructive">{errorMessage(confirm.error)}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {stage === "CONFIRMED" ? (
        <div className="space-y-6">
          <p className="text-sm leading-6 text-muted-foreground">
            Workers can revisit the same link and look up their shifts with their employee ID.
          </p>
          <ShareLink url={data.shareUrl} />
          <ScheduleStage requirementId={requirementId} editable={false} />
          {stageIsCurrent ? (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                disabled={reopen.isPending}
                onClick={() => {
                  reopen.mutate();
                }}
              >
                <RotateCcw />
                {reopen.isPending ? "Reopening…" : "Reopen for editing"}
              </Button>
              {reopen.error ? (
                <p className="text-sm text-destructive">{errorMessage(reopen.error)}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <ShiftRequirementEditDialog
        requirement={data}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
  );
}
