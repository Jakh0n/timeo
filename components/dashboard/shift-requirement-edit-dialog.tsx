"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";
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
  shiftRequirementQueryKey,
  shiftRequirementsQueryKey,
  updateShiftRequirement,
  type ShiftRequirementDetail,
} from "@/lib/shift-requirements";
import {
  COUNT_FIELDS,
  shiftRequirementSchema,
  type ShiftRequirementValues,
} from "@/components/dashboard/shift-requirement-form";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

function EditForm({
  requirement,
  onClose,
}: {
  requirement: ShiftRequirementDetail;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const branches = useQuery({
    queryKey: branchesQueryKey,
    queryFn: fetchBranches,
    retry: false,
  });
  const form = useForm<ShiftRequirementValues>({
    resolver: zodResolver(shiftRequirementSchema),
    mode: "onBlur",
    defaultValues: {
      branchId: requirement.branchId,
      cycleLabel: requirement.cycleLabel,
      weekdayDayRequired: requirement.weekdayDayRequired,
      weekdayNightRequired: requirement.weekdayNightRequired,
      weekendDayRequired: requirement.weekendDayRequired,
      weekendNightRequired: requirement.weekendNightRequired,
      requiredSeniorPerShift: requirement.requiredSeniorPerShift,
      maxSeniorPerShift: requirement.maxSeniorPerShift,
    },
  });
  const save = useMutation({
    mutationFn: (values: ShiftRequirementValues) =>
      updateShiftRequirement(requirement.id, values),
    onSuccess: async (updated) => {
      queryClient.setQueryData(shiftRequirementQueryKey(requirement.id), updated);
      await queryClient.invalidateQueries({ queryKey: shiftRequirementsQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
      onClose();
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          save.mutate(values);
        })}
        noValidate
      >
        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
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
                <Input className="h-10" {...field} />
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
        {branches.isSuccess && branches.data.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Add a branch before saving.{" "}
            <Link href="/manager/branches" className="text-primary">
              Go to branches
            </Link>
          </p>
        ) : null}
        {save.error ? (
          <p className="text-sm text-destructive">{errorMessage(save.error)}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ShiftRequirementEditDialog({
  requirement,
  open,
  onOpenChange,
}: {
  requirement: ShiftRequirementDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit shift requirement</DialogTitle>
          <DialogDescription>
            Update the counts before you start collecting availability.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <EditForm
            requirement={requirement}
            onClose={() => {
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
