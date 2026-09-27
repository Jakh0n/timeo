import { RequireSession } from "@/components/auth/require-session";

export default function HomePage() {
  return <RequireSession mode="entry" />;
}
