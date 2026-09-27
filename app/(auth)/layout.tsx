import type { ReactNode } from "react";
import { RequireSession } from "@/components/auth/require-session";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <RequireSession mode="guest">{children}</RequireSession>;
}
