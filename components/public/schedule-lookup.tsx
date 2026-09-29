"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  fetchMySchedule,
  hourLabel,
  WEEKDAY_OPTIONS,
  type Weekday,
} from "@/lib/public-shift";

const lookupSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, "Enter your employee ID.")
    .max(40, "That employee ID is too long."),
});

type LookupValues = z.infer<typeof lookupSchema>;

function dayLabel(day: Weekday): string {
  return WEEKDAY_OPTIONS.find((option) => option.day === day)?.label ?? day;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

export function ScheduleLookup({
  linkToken,
  restaurantName,
  branchName,
  cycleLabel,
}: {
  linkToken: string;
  restaurantName: string;
  branchName: string;
  cycleLabel: string;
}) {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const form = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    mode: "onBlur",
    defaultValues: { employeeId: "" },
  });
  const schedule = useQuery({
    queryKey: ["my-schedule", linkToken, employeeId],
    queryFn: () => fetchMySchedule(linkToken, employeeId ?? ""),
    enabled: Boolean(employeeId),
    retry: false,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{restaurantName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your schedule
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {branchName} · {cycleLabel}
        </p>
      </div>

      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            const nextId = values.employeeId.trim();
            if (nextId === employeeId) {
              void schedule.refetch();
              return;
            }
            setEmployeeId(nextId);
          })}
          noValidate
        >
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input autoComplete="off" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="h-10 w-full" disabled={schedule.isFetching}>
            <Search />
            {schedule.isFetching ? "Checking…" : "Check schedule"}
          </Button>
        </form>
      </Form>

      {schedule.isError ? (
        <p className="text-sm text-destructive">{errorMessage(schedule.error)}</p>
      ) : null}

      {schedule.data?.status === "GENERATED" ? (
        <p className="text-sm leading-6">
          Your manager hasn't confirmed the schedule yet — check back soon
        </p>
      ) : null}

      {schedule.data?.status === "CONFIRMED" && !schedule.data.found ? (
        <p className="text-sm leading-6 text-muted-foreground">
          We couldn't find shifts for that employee ID. Check the ID and try
          again.
        </p>
      ) : null}

      {schedule.data?.status === "CONFIRMED" && schedule.data.found ? (
        <div className="space-y-4">
          <p className="text-sm leading-6">
            Shifts for {schedule.data.workerName}
          </p>
          <ul className="divide-y divide-border">
            {schedule.data.shifts.map((shift) => {
              const wraps = shift.endHour <= shift.startHour;

              return (
                <li
                  key={`${shift.day}-${shift.shiftType}`}
                  className="space-y-1 py-3"
                >
                  <p className="text-sm font-medium">
                    {dayLabel(shift.day)} ·{" "}
                    {shift.shiftType === "DAY" ? "Day shift" : "Night shift"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hourLabel(shift.startHour)}–{hourLabel(shift.endHour)}
                    {wraps ? " · continues into the next day" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{shift.branchName}</p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
