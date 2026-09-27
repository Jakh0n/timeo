import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { RequireSession } from "@/components/auth/require-session";

export default function OnboardingPage() {
  return (
    <RequireSession mode="onboarding">
      <AuthShell
        title="What's your restaurant called?"
        description="This becomes your workspace."
      >
        <OnboardingForm />
      </AuthShell>
    </RequireSession>
  );
}
