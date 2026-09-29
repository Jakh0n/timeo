"use client";

import { useQuery } from "@tanstack/react-query";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { currentUserQueryKey, fetchCurrentUser } from "@/lib/auth";

function roleLabel(role: "OWNER" | "MANAGER"): string {
  return role === "OWNER" ? "Owner" : "Manager";
}

export function SettingsPage() {
  const session = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  if (session.isPending) {
    return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  }

  if (session.isError) {
    const message =
      session.error instanceof ApiError
        ? session.error.message
        : "We couldn't load settings. Try again.";

    return (
      <div className="max-w-md space-y-3">
        <p className="text-sm text-destructive">{message}</p>
        <Button
          variant="outline"
          onClick={() => {
            void session.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const manager = session.data;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageIntro description="The restaurant you manage, and the account you sign in with." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border px-5 py-5">
          <h2 className="text-sm font-medium">Restaurant</h2>
          <dl className="mt-4">
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="mt-1 text-base font-medium">
              {manager.organization?.name ?? "No restaurant yet"}
            </dd>
          </dl>
        </section>
        <section className="rounded-xl border border-border px-5 py-5">
          <h2 className="text-sm font-medium">Account</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="mt-1 text-base font-medium">{manager.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Role</dt>
              <dd className="mt-1 text-base font-medium">{roleLabel(manager.role)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="mt-1 text-base font-medium">{manager.email}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
