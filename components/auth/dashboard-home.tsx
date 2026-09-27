"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  currentUserQueryKey,
  fetchCurrentUser,
  logoutAccount,
} from "@/lib/auth";

export function DashboardHome() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const logout = useMutation({
    mutationFn: logoutAccount,
    onSuccess: async () => {
      queryClient.clear();
      router.replace("/login");
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {user.data
            ? `Signed in as ${user.data.name}.`
            : "Your restaurant workspace."}
        </p>
      </div>
      <div>
        <Button
          variant="outline"
          disabled={logout.isPending}
          onClick={() => {
            logout.mutate();
          }}
        >
          {logout.isPending ? "Logging out…" : "Log out"}
        </Button>
      </div>
    </main>
  );
}
