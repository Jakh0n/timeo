"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageIntro } from "@/components/dashboard/page-intro";
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
    <div className="flex w-full flex-col gap-6">
      <PageIntro
        description="A shift requirement is one week at one branch. It creates the link you send to the team."
        action={
          <Button
            onClick={() => {
              setCreating(true);
            }}
          >
            <Plus />
            New shift requirement
          </Button>
        }
      />

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
        <EmptyState
          title="No shift requirements yet"
          description="Create one for a branch. You get a link, staff send availability, then you confirm the week."
        />
      ) : null}

      {requirements.isSuccess && requirements.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border">
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
        </div>
      ) : null}

      <ShiftRequirementForm open={creating} onOpenChange={setCreating} />
    </div>
  );
}
