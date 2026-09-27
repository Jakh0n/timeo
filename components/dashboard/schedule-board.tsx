"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Moon, Sun, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { overviewQueryKey } from "@/lib/dashboard";
import { hourLabel, WEEKDAY_OPTIONS } from "@/lib/public-shift";
import {
  addAssignment,
  removeAssignment,
  scheduleQueryKey,
  type ScheduleSlot,
} from "@/lib/shift-requirements";

const DAY_ORDER = WEEKDAY_OPTIONS.map((option) => option.day);

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

function dayLabel(day: ScheduleSlot["day"]): string {
  return WEEKDAY_OPTIONS.find((option) => option.day === day)?.label ?? day;
}

function groupByDay(slots: ScheduleSlot[]): { day: ScheduleSlot["day"]; slots: ScheduleSlot[] }[] {
  return DAY_ORDER.flatMap((day) => {
    const daySlots = slots.filter((slot) => slot.day === day);
    if (daySlots.length === 0) {
      return [];
    }

    return [
      {
        day,
        slots: [...daySlots].sort((left, right) =>
          left.shiftType === right.shiftType ? 0 : left.shiftType === "DAY" ? -1 : 1,
        ),
      },
    ];
  });
}

function SlotRow({
  requirementId,
  slot,
  editable,
}: {
  requirementId: string;
  slot: ScheduleSlot;
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const short = slot.assignments.length < slot.requiredTotal;
  const night = slot.shiftType === "NIGHT";
  const add = useMutation({
    mutationFn: (employeeId: string) =>
      addAssignment(requirementId, {
        employeeId,
        day: slot.day,
        shiftType: slot.shiftType,
      }),
    onSuccess: async (slots) => {
      queryClient.setQueryData(scheduleQueryKey(requirementId), slots);
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
    },
  });
  const remove = useMutation({
    mutationFn: (assignmentId: string) => removeAssignment(requirementId, assignmentId),
    onSuccess: async (slots) => {
      queryClient.setQueryData(scheduleQueryKey(requirementId), slots);
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
    },
  });

  return (
    <div
      className={
        short
          ? "rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4"
          : night
            ? "rounded-xl bg-muted px-4 py-4"
            : "rounded-xl border border-border px-4 py-4"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          {night ? <Moon className="size-4" /> : <Sun className="size-4" />}
          {night ? "Night" : "Day"}
          <span className="font-normal text-muted-foreground">
            {hourLabel(slot.startHour)}–{hourLabel(slot.endHour)}
          </span>
        </p>
        <p className={short ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
          {slot.assignments.length} of {slot.requiredTotal}
        </p>
      </div>

      {slot.assignments.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {slot.assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-sm"
            >
              <span>{assignment.workerName}</span>
              <span className="text-muted-foreground">{assignment.employeeId}</span>
              {editable ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${assignment.workerName}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    remove.mutate(assignment.id);
                  }}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No one assigned</p>
      )}

      {slot.reason ? (
        <p className="mt-3 text-sm leading-6 text-destructive">{slot.reason}</p>
      ) : null}

      {editable && slot.candidates.length > 0 ? (
        <div className="mt-3 max-w-xs">
          <Select
            key={slot.assignments.map((assignment) => assignment.id).join("-")}
            onValueChange={(employeeId) => {
              add.mutate(employeeId);
            }}
            disabled={add.isPending}
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder={add.isPending ? "Adding…" : "Add a person"} />
            </SelectTrigger>
            <SelectContent>
              {slot.candidates.map((candidate) => (
                <SelectItem key={candidate.employeeId} value={candidate.employeeId}>
                  {candidate.workerName} · {candidate.employeeId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {add.error || remove.error ? (
        <p className="mt-3 text-sm text-destructive">
          {errorMessage(add.error ?? remove.error)}
        </p>
      ) : null}
    </div>
  );
}

export function ScheduleBoard({
  requirementId,
  slots,
  editable,
}: {
  requirementId: string;
  slots: ScheduleSlot[];
  editable: boolean;
}) {
  const groups = groupByDay(slots);
  const shortCount = slots.filter(
    (slot) => slot.assignments.length < slot.requiredTotal,
  ).length;

  if (groups.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        This schedule has no shifts to fill.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {shortCount > 0 ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-5 py-4">
          <p className="text-base font-semibold text-destructive">
            {shortCount === 1
              ? "1 shift is still short"
              : `${shortCount} shifts are still short`}
          </p>
          <p className="mt-1 text-sm leading-6 text-destructive">
            Each short shift is marked below with the reason.
          </p>
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          Every requested shift has enough people assigned.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.day} className="space-y-3">
          <h3 className="text-sm font-medium">{dayLabel(group.day)}</h3>
          <div className="space-y-3">
            {group.slots.map((slot) => (
              <SlotRow
                key={`${slot.day}-${slot.shiftType}`}
                requirementId={requirementId}
                slot={slot}
                editable={editable}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
