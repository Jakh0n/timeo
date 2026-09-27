import type { ReactNode } from "react";
import { RequireSession } from "@/components/auth/require-session";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <RequireSession mode="app">{children}</RequireSession>;
}
