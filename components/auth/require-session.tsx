"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { currentUserQueryKey, fetchCurrentUser } from "@/lib/auth";

type SessionMode = "entry" | "guest" | "onboarding" | "app";

type RequireSessionProps = {
  mode: SessionMode;
  children?: ReactNode;
};

function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function nextPath(
  mode: SessionMode,
  unauthenticated: boolean,
  hasOrganization: boolean,
): string | null {
  if (mode === "entry") {
    if (unauthenticated) {
      return "/login";
    }

    return hasOrganization ? "/manager/dashboard" : "/onboarding";
  }

  if (mode === "guest") {
    if (unauthenticated) {
      return null;
    }

    return hasOrganization ? "/manager/dashboard" : "/onboarding";
  }

  if (mode === "onboarding") {
    if (unauthenticated) {
      return "/login";
    }

    return hasOrganization ? "/manager/dashboard" : null;
  }

  if (unauthenticated) {
    return "/login";
  }

  return hasOrganization ? null : "/onboarding";
}

export function RequireSession({ mode, children }: RequireSessionProps) {
  const router = useRouter();
  const query = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const unauthenticated = query.isError && isUnauthenticated(query.error);
  const failed =
    query.isError && !isUnauthenticated(query.error);
  const destination =
    query.isSuccess || unauthenticated
      ? nextPath(mode, unauthenticated, query.data?.hasOrganization ?? false)
      : null;

  useEffect(() => {
    if (destination) {
      router.replace(destination);
    }
  }, [destination, router]);

  if (query.isPending || destination) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Checking your account…</p>
      </main>
    );
  }

  if (failed) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[420px] space-y-4 text-center">
          <p className="text-sm text-destructive">
            We couldn&apos;t reach the server. Try again.
          </p>
          <button
            type="button"
            className="text-sm text-primary"
            onClick={() => {
              void query.refetch();
            }}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return children;
}
