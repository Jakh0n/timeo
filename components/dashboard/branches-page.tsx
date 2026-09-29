"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageIntro } from "@/components/dashboard/page-intro";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  branchesQueryKey,
  createBranch,
  deleteBranch,
  fetchBranches,
  updateBranch,
  type Branch,
} from "@/lib/branches";
import { overviewQueryKey } from "@/lib/dashboard";

const branchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a branch name.")
    .max(80, "That name is too long."),
  address: z
    .string()
    .trim()
    .min(1, "Enter an address.")
    .max(200, "That address is too long."),
});

type BranchValues = z.infer<typeof branchSchema>;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Something went wrong. Try again.";
}

function BranchFormDialog({
  open,
  branch,
  onOpenChange,
}: {
  open: boolean;
  branch: Branch | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<BranchValues>({
    resolver: zodResolver(branchSchema),
    mode: "onBlur",
    values: {
      name: branch?.name ?? "",
      address: branch?.address ?? "",
    },
  });

  const save = useMutation({
    mutationFn: (values: BranchValues) =>
      branch
        ? updateBranch(branch.id, values)
        : createBranch(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: branchesQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{branch ? "Edit branch" : "Add branch"}</DialogTitle>
          <DialogDescription>
            A branch is one location of this restaurant.
          </DialogDescription>
        </DialogHeader>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="organization" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input autoComplete="street-address" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {save.error ? (
              <p className="text-sm text-destructive">{errorMessage(save.error)}</p>
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
              <Button type="submit" disabled={save.isPending}>
                <Check />
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function BranchesPage() {
  const queryClient = useQueryClient();
  const branches = useQuery({
    queryKey: branchesQueryKey,
    queryFn: fetchBranches,
    retry: false,
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Branch | null>(null);

  const remove = useMutation({
    mutationFn: (branchId: string) => deleteBranch(branchId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: branchesQueryKey });
      await queryClient.invalidateQueries({ queryKey: overviewQueryKey });
      setPendingDelete(null);
    },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <PageIntro
        description="Each branch is one location. Schedules are built for that team."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus />
            Add branch
          </Button>
        }
      />

      {branches.isPending ? (
        <p className="text-sm text-muted-foreground">Loading branches…</p>
      ) : null}

      {branches.isError ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive">{errorMessage(branches.error)}</p>
          <Button
            variant="outline"
            onClick={() => {
              void branches.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {branches.isSuccess && branches.data.length === 0 ? (
        <EmptyState
          title="No branches yet"
          description="Add the first location. You can collect availability and build a schedule after that."
        />
      ) : null}

      {branches.isSuccess && branches.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.data.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-medium whitespace-normal">
                  {branch.name}
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {branch.address}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(branch);
                      setEditorOpen(true);
                    }}
                  >
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      remove.reset();
                      setPendingDelete(branch);
                    }}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <BranchFormDialog
        open={editorOpen}
        branch={editing}
        onOpenChange={setEditorOpen}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this branch?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `${pendingDelete.name} will be removed from this restaurant.`
                : "This branch will be removed."}
            </DialogDescription>
          </DialogHeader>
          {remove.error ? (
            <p className="text-sm text-destructive">{errorMessage(remove.error)}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={remove.isPending || !pendingDelete}
              onClick={() => {
                if (pendingDelete) {
                  remove.mutate(pendingDelete.id);
                }
              }}
            >
              <Trash2 />
              {remove.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
