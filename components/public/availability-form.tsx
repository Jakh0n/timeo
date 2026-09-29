"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AvailabilityDay,
  defaultWindow,
  type AvailabilityDayState,
} from "@/components/public/availability-day";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import type { ShiftStatus } from "@/lib/dashboard";
import {
  fetchOwnSubmission,
  submitAvailability,
  WEEKDAY_OPTIONS,
  type AvailabilityEntryInput,
} from "@/lib/public-shift";

const identitySchema = z.object({
  workerName: z
    .string()
    .trim()
    .min(1, "Enter your full name.")
    .max(80, "That name is too long."),
  employeeId: z
    .string()
    .trim()
    .min(1, "Enter your employee ID.")
    .max(40, "That employee ID is too long."),
});

type IdentityValues = z.infer<typeof identitySchema>;

function emptyDays(): AvailabilityDayState[] {
  return WEEKDAY_OPTIONS.map((option) => ({
    day: option.day,
    label: option.label,
    available: false,
    windows: [defaultWindow()],
  }));
}

function daysFromEntries(
  entries: AvailabilityEntryInput[],
): AvailabilityDayState[] {
  return WEEKDAY_OPTIONS.map((option) => {
    const windows = entries
      .filter((entry) => entry.day === option.day)
      .map((entry) => ({
        shiftType: entry.shiftType,
        startHour: entry.startHour,
        endHour: entry.endHour,
      }));

    return {
      day: option.day,
      label: option.label,
      available: windows.length > 0,
      windows: windows.length > 0 ? windows : [defaultWindow()],
    };
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

export function AvailabilityForm({
  linkToken,
  status,
  restaurantName,
  branchName,
  cycleLabel,
}: {
  linkToken: string;
  status: ShiftStatus;
  restaurantName: string;
  branchName: string;
  cycleLabel: string;
}) {
  const [days, setDays] = useState<AvailabilityDayState[]>(emptyDays);
  const [lookupId, setLookupId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);
  const form = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    mode: "onBlur",
    defaultValues: { workerName: "", employeeId: "" },
  });

  const previous = useQuery({
    queryKey: ["public-submission", linkToken, lookupId],
    queryFn: () => fetchOwnSubmission(linkToken, lookupId ?? ""),
    enabled:
      Boolean(lookupId) && (status === "COLLECTING" || status === "DRAFT"),
    retry: false,
  });

  useEffect(() => {
    if (!lookupId || previous.isFetching || !previous.data) {
      return;
    }

    if (previous.data.found) {
      if (loadedFor.current === lookupId) {
        return;
      }

      loadedFor.current = lookupId;
      setDays(daysFromEntries(previous.data.entries));
      form.setValue("workerName", previous.data.workerName);
      setEditing(true);
      return;
    }

    setEditing(false);

    if (loadedFor.current) {
      loadedFor.current = null;
      setDays(emptyDays());
    }
  }, [form, lookupId, previous.data, previous.isFetching]);

  const submit = useMutation({
    mutationFn: (input: {
      workerName: string;
      employeeId: string;
      entries: AvailabilityEntryInput[];
    }) => submitAvailability(linkToken, input),
    onSuccess: (_result, variables) => {
      setSubmittedName(variables.workerName);
    },
  });

  if (submittedName) {
    return (
      <div className="space-y-3 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          You're all set
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {editing
            ? `${submittedName}, your availability is updated for ${cycleLabel}. You can close this page.`
            : `${submittedName}, we saved your availability for ${cycleLabel}. You can close this page.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{restaurantName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          When can you work?
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {branchName} · {cycleLabel}
        </p>
      </div>

      {editing ? (
        <p className="text-sm leading-6">
          You're editing the availability you already sent. Saving replaces it.
        </p>
      ) : null}

      <Form {...form}>
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((values) => {
            const entries = days.flatMap((day) =>
              day.available
                ? day.windows.map((window) => ({
                    day: day.day,
                    shiftType: window.shiftType,
                    startHour: window.startHour,
                    endHour: window.endHour,
                  }))
                : [],
            );

            if (entries.length === 0) {
              setDayError("Mark at least one day you can work.");
              return;
            }

            setDayError(null);
            submit.mutate({
              workerName: values.workerName,
              employeeId: values.employeeId,
              entries,
            });
          })}
          noValidate
        >
          <FormField
            control={form.control}
            name="workerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    className="h-10"
                    {...field}
                    onBlur={(event) => {
                      field.onBlur();
                      const employeeId = event.target.value.trim();
                      if (employeeId.length > 0) {
                        setLookupId(employeeId);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-sm leading-6 text-muted-foreground">
            If the end hour is earlier than the start hour, that window
            continues into the next day. For example, 18:00 to 06:00.
          </p>

          <div>
            {days.map((day, index) => (
              <AvailabilityDay
                key={day.day}
                day={day}
                onChange={(next) => {
                  setDays((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? next : item,
                    ),
                  );
                }}
              />
            ))}
          </div>

          {dayError ? (
            <p className="text-sm text-destructive">{dayError}</p>
          ) : null}
          {previous.isError ? (
            <p className="text-sm text-destructive">
              {errorMessage(previous.error)}
            </p>
          ) : null}
          {submit.error ? (
            <p className="text-sm text-destructive">
              {errorMessage(submit.error)}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-10 w-full"
            disabled={submit.isPending}
          >
            <Send />
            {submit.isPending
              ? "Saving…"
              : editing
                ? "Update availability"
                : "Submit availability"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
