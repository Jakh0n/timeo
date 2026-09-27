"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { branchesQueryKey, fetchBranches } from "@/lib/branches";
import { overviewQueryKey } from "@/lib/dashboard";
import {
  createShiftRequirement,
  shiftRequirementsQueryKey,
} from "@/lib/shift-requirements";

const count = (message: string) =>
  z
    .number({ error: message })
    .int(message)
    .min(0, "Use 0 or more.")
    .max(50, "Use 50 or fewer.");

const shiftRequirementSchema = z
  .object({
    branchId: z.string().min(1, "Choose a branch."),
    cycleLabel: z
      .string()
      .trim()
      .min(1, "Enter a cycle label.")
      .max(40, "That cycle label is too long."),
    weekdayDayRequired: count("Enter a whole number for the weekday day shift."),
    weekdayNightRequired: count(
      "Enter a whole number for the weekday night shift.",
    ),
    weekendDayRequired: count("Enter a whole number for the weekend day shift."),
    weekendNightRequired: count(
      "Enter a whole number for the weekend night shift.",
    ),
    requiredSeniorPerShift: count("Enter a whole number for the minimum seniors."),
    maxSeniorPerShift: count("Enter a whole number for the maximum seniors."),
  })
  .refine(
    (value) =>
      value.weekdayDayRequired +
        value.weekdayNightRequired +
        value.weekendDayRequired +
        value.weekendNightRequired >
      0,
    {
      message: "Enter how many people you need for at least one shift.",
      path: ["weekdayDayRequired"],
    },
  )
  .refine((value) => value.maxSeniorPerShift >= value.requiredSeniorPerShift, {
    message: "Max seniors can't be lower than the minimum.",
    path: ["maxSeniorPerShift"],
  });

type ShiftRequirementValues = z.infer<typeof shiftRequirementSchema>;

const COUNT_FIELDS = [
  { name: "weekdayDayRequired", label: "Weekday day shift" },
  { name: "weekdayNightRequired", label: "Weekday night shift" },
  { name: "weekendDayRequired", label: "Weekend day shift" },
  { name: "weekendNightRequired", label: "Weekend night shift" },
  { name: "requiredSeniorPerShift", label: "Minimum seniors per shift" },
  { name: "maxSeniorPerShift", label: "Maximum seniors per shift" },
] as const;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

export function ShiftRequirementForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const branches = useQuery({
    queryKey: branchesQueryKey,
    queryFn: fetchBranches,
    retry: false,
    enabled: open,
  });
  const form = useForm<ShiftRequirementValues>({
    resolver: zodResolver(shiftRequirementSchema),
    mode: "onBlur",
    defaultValues: {
      branchId: "",
      cycleLabel: "",
      weekdayDayRequired: 0,
      weekdayNightRequired: 0,
      weekendDayRequired: 0,
      weekendNightRequired: 0,
      requiredSeniorPerShift: 1,
      maxSeniorPerShift: 1,
    },
  });

  const create = useMutation({
    mutationFn: createShiftRequirement,
    onSuccess: async (requirement) => {
      await queryClient.invalidateQueries({ queryKey: shiftRequirementsQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
      onOpenChange(false);
      form.reset();
      router.push(`/manager/shift-requirements/${requirement.id}`);
    },
  });

  const hasBranches = (branches.data?.length ?? 0) > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          create.reset();
          form.reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New shift requirement</DialogTitle>
          <DialogDescription>
            Set how many people this branch needs for the cycle.
          </DialogDescription>
        </DialogHeader>

        {branches.isSuccess && !hasBranches ? (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Add a branch before you create a shift requirement.
            </p>
            <Button asChild>
              <Link href="/manager/branches">Add your first branch</Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                create.mutate(values);
              })}
              noValidate
            >
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 w-full" onBlur={field.onBlur}>
                          <SelectValue placeholder="Choose a branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.data?.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cycleLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle label</FormLabel>
                    <FormControl>
                      <Input className="h-10" placeholder="Fall2026" {...field} />
                    </FormControl>
                    <FormDescription>For example, Fall2026.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {COUNT_FIELDS.map((countField) => (
                  <FormField
                    key={countField.name}
                    control={form.control}
                    name={countField.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{countField.label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={50}
                            inputMode="numeric"
                            className="h-10"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={Number.isNaN(field.value) ? "" : field.value}
                            onChange={(event) => {
                              field.onChange(
                                event.target.value === ""
                                  ? Number.NaN
                                  : event.target.valueAsNumber,
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              {create.error ? (
                <p className="text-sm text-destructive">
                  {errorMessage(create.error)}
                </p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending || !hasBranches}>
                  {create.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
