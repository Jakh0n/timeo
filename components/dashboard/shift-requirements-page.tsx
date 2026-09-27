"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShiftRequirementForm } from "@/components/dashboard/shift-requirement-form";
import { ShiftStatusBadge } from "@/components/dashboard/shift-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import {
  fetchShiftRequirements,
  shiftRequirementsQueryKey,
} from "@/lib/shift-requirements";

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

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "We couldn't load shift requirements. Try again.";
}

export function ShiftRequirementsPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const requirements = useQuery({
    queryKey: shiftRequirementsQueryKey,
    queryFn: fetchShiftRequirements,
    retry: false,
  });

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setCreating(true);
          }}
        >
          New Shift Requirement
        </Button>
      </div>

      {requirements.isPending ? (
        <p className="text-sm text-muted-foreground">Loading shift requirements…</p>
      ) : null}

      {requirements.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive">{errorMessage(requirements.error)}</p>
          <Button
            variant="outline"
            onClick={() => {
              void requirements.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {requirements.isSuccess && requirements.data.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          No shift requirements yet. Create one to get a link for the team.
        </p>
      ) : null}

      {requirements.isSuccess && requirements.data.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.data.map((requirement) => {
              const href = `/manager/shift-requirements/${requirement.id}`;

              return (
                <TableRow
                  key={requirement.id}
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(href);
                  }}
                >
                  <TableCell className="whitespace-normal">
                    {requirement.branchName}
                  </TableCell>
                  <TableCell className="font-medium whitespace-normal">
                    <Link
                      href={href}
                      className="underline-offset-4 hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      {requirement.cycleLabel}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ShiftStatusBadge status={requirement.status} />
                  </TableCell>
                  <TableCell>{requirement.submissionCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCreatedDate(requirement.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}

      <ShiftRequirementForm open={creating} onOpenChange={setCreating} />
    </div>
  );
}
