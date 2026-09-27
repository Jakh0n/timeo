import { PublicShiftPage } from "@/components/public/public-shift-page";

export default async function PublicLinkPage({
  params,
}: {
  params: Promise<{ linkToken: string }>;
}) {
  const { linkToken } = await params;

  return <PublicShiftPage linkToken={linkToken} />;
}
