"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RequireSession } from "@/components/auth/require-session";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  currentUserQueryKey,
  fetchCurrentUser,
  logoutAccount,
} from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/manager/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/manager/branches", label: "Branches", icon: Store },
  {
    href: "/manager/shift-requirements",
    label: "Shift Requirements",
    icon: CalendarDays,
  },
  { href: "/manager/settings", label: "Settings", icon: Settings },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/manager/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string): string {
  const match = NAV_ITEMS.find((item) => isNavActive(pathname, item.href));
  return match?.label ?? "Overview";
}

function ManagerFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const logout = useMutation({
    mutationFn: logoutAccount,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
    },
  });

  const organizationName =
    session.data?.organization?.name ?? "Your restaurant";
  const manager = session.data;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex-row items-center gap-1 px-3 py-4 group-data-[collapsible=icon]:justify-center">
          <p className="min-w-0 flex-1 truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
            {organizationName}
          </p>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu className="gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isNavActive(pathname, item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="gap-3 px-3 py-4">
          {manager ? (
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{manager.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {manager.email}
              </p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            className="h-9 w-full justify-start px-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            disabled={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
          >
            <LogOut />
            <span className="group-data-[collapsible=icon]:hidden">
              {logout.isPending ? "Logging out…" : "Log out"}
            </span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:px-8">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold tracking-tight">
            {pageTitle(pathname)}
          </h1>
        </header>
        <div className="flex flex-1 flex-col px-4 py-8 md:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession mode="app">
      <ManagerFrame>{children}</ManagerFrame>
    </RequireSession>
  );
}
