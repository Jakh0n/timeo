"use client";

import { useQuery } from "@tanstack/react-query";
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
import { fetchSubmissions, submissionsQueryKey } from "@/lib/shift-requirements";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "We couldn't load submissions. Try again.";
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function SubmissionList({
  requirementId,
  live,
}: {
  requirementId: string;
  live: boolean;
}) {
  const submissions = useQuery({
    queryKey: submissionsQueryKey(requirementId),
    queryFn: () => fetchSubmissions(requirementId),
    retry: false,
    refetchInterval: live ? 5000 : false,
  });

  if (submissions.isPending) {
    return <p className="text-sm text-muted-foreground">Loading submissions…</p>;
  }

  if (submissions.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{errorMessage(submissions.error)}</p>
        <Button
          variant="outline"
          onClick={() => {
            void submissions.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const count = submissions.data.count;

  return (
    <div className="space-y-4">
      <p className="text-base font-medium">
        {count === 1 ? "1 submission so far" : `${count} submissions so far`}
      </p>
      {count === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          No one has sent availability yet. Share the link, then generate when you decide there is enough.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.data.submissions.map((submission) => (
              <TableRow key={submission.employeeId}>
                <TableCell>{submission.workerName}</TableCell>
                <TableCell>{submission.employeeId}</TableCell>
                <TableCell>{formatSubmittedAt(submission.submittedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
