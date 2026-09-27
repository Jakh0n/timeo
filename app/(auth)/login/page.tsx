import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Log in"
      description="Pick up where you left off."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
